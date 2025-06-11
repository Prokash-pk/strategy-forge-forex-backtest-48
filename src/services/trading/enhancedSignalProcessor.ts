import { supabase } from '@/integrations/supabase/client';
import { SignalToTradeBridge } from './signalToTradeBridge';
import { TradeExecutionDebugger } from './tradeExecutionDebugger';

export interface ProcessedSignal {
  signal: 'BUY' | 'SELL' | 'CLOSE' | 'NONE';
  symbol: string;
  currentPrice: number;
  timestamp: string;
  confidence: number;
  strategyName: string;
}

export class EnhancedSignalProcessor {
  private static instance: EnhancedSignalProcessor;
  private tradeBridge: SignalToTradeBridge | null = null;

  static getInstance(): EnhancedSignalProcessor {
    if (!EnhancedSignalProcessor.instance) {
      EnhancedSignalProcessor.instance = new EnhancedSignalProcessor();
    }
    return EnhancedSignalProcessor.instance;
  }

  async initializeTradeBridge(strategyId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        await TradeExecutionDebugger.logExecutionStep('BRIDGE_INIT_ERROR', {
          error: 'No authenticated user found',
          critical: true
        });
        return false;
      }

      await TradeExecutionDebugger.logExecutionStep('BRIDGE_INIT_START', {
        strategyId,
        userId: user.id
      }, user.id);

      this.tradeBridge = await SignalToTradeBridge.createFromSavedConfig(strategyId, user.id);
      
      const success = !!this.tradeBridge;
      await TradeExecutionDebugger.logExecutionStep('BRIDGE_INIT_RESULT', {
        success,
        bridgeCreated: success
      }, user.id);

      return success;
    } catch (error) {
      await TradeExecutionDebugger.logExecutionStep('BRIDGE_INIT_EXCEPTION', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  async processSignal(signal: ProcessedSignal): Promise<{ success: boolean; message: string; tradeExecuted: boolean }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    await TradeExecutionDebugger.logExecutionStep('SIGNAL_RECEIVED', {
      signal: signal.signal,
      symbol: signal.symbol,
      confidence: signal.confidence,
      currentPrice: signal.currentPrice,
      strategyName: signal.strategyName,
      hasTradeBridge: !!this.tradeBridge
    }, user?.id);

    if (!this.tradeBridge) {
      const errorMsg = 'Trade bridge not initialized - cannot execute trades';
      await TradeExecutionDebugger.logExecutionStep('BRIDGE_NOT_INITIALIZED', {
        error: errorMsg,
        critical: true
      }, user?.id);
      
      return { 
        success: false, 
        message: errorMsg, 
        tradeExecuted: false 
      };
    }

    try {
      // Convert to trade bridge format
      const strategySignal = {
        signal: signal.signal,
        symbol: signal.symbol,
        confidence: signal.confidence * 100,
        currentPrice: signal.currentPrice,
        strategyName: signal.strategyName
      };

      await TradeExecutionDebugger.logExecutionStep('SIGNAL_PROCESSING', {
        convertedSignal: strategySignal,
        confidencePercentage: strategySignal.confidence
      }, user?.id);

      // Execute the trade
      const result = await this.tradeBridge.processSignal(strategySignal);
      
      await TradeExecutionDebugger.logExecutionStep('TRADE_EXECUTION_RESULT', {
        success: result.success,
        message: result.message,
        tradeId: result.tradeId,
        executed: result.success
      }, user?.id);

      // Log the execution result
      await this.logTradeExecution(signal, result);

      return {
        success: result.success,
        message: result.message,
        tradeExecuted: result.success
      };

    } catch (error) {
      const errorMessage = `Trade processing error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      await TradeExecutionDebugger.logExecutionStep('TRADE_PROCESSING_ERROR', {
        error: errorMessage,
        errorType: error?.constructor?.name
      }, user?.id);
      
      await this.logTradeExecution(signal, { success: false, message: errorMessage });
      
      return {
        success: false,
        message: errorMessage,
        tradeExecuted: false
      };
    }
  }

  private async logTradeExecution(signal: ProcessedSignal, result: { success: boolean; message: string; tradeId?: string }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('trading_logs').insert({
        user_id: user.id,
        session_id: crypto.randomUUID(),
        log_type: result.success ? 'info' : 'error',
        message: `TRADE EXECUTION: ${signal.signal} ${signal.symbol} at ${signal.currentPrice} - ${result.message}`,
        trade_data: {
          signal_data: signal,
          execution_result: result,
          timestamp: new Date().toISOString(),
          trade_executed: result.success,
          live_trading: true,
          debug_info: {
            confidence_met: signal.confidence >= 0.7,
            signal_type: signal.signal,
            price_valid: signal.currentPrice > 0
          }
        } as any
      });
    } catch (error) {
      console.error('Failed to log trade execution:', error);
    }
  }

  // Method to test signal generation manually
  async testSignalGeneration(strategyCode: string, marketData: any): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    
    await TradeExecutionDebugger.logExecutionStep('MANUAL_SIGNAL_TEST', {
      hasStrategyCode: !!strategyCode,
      marketDataAvailable: !!marketData,
      dataPoints: marketData?.close?.length || 0
    }, user?.id);

    return await TradeExecutionDebugger.analyzeLastStrategy(strategyCode, marketData);
  }

  // NEW: Get real OANDA market data for the past 24 hours
  async getRealMarketData(symbol: string = 'EUR_USD', timeframe: string = 'M15'): Promise<any> {
    try {
      console.log(`📊 Fetching real market data for ${symbol} (${timeframe}) - past 24 hours`);
      
      // Get OANDA config from localStorage
      const savedConfig = localStorage.getItem('oanda_config');
      if (!savedConfig) {
        console.warn('⚠️ No OANDA config found - using sample data instead');
        return this.getSampleMarketData();
      }

      const config = JSON.parse(savedConfig);
      if (!config.accountId || !config.apiKey) {
        console.warn('⚠️ Incomplete OANDA config - using sample data instead');
        return this.getSampleMarketData();
      }

      // Import the OANDA service
      const { OANDAMarketDataService } = await import('../oandaMarketDataService');
      
      // Calculate candle count for 24 hours based on timeframe
      const candleCount = this.calculateCandlesFor24Hours(timeframe);
      
      const marketData = await OANDAMarketDataService.fetchLiveMarketData(
        config.accountId,
        config.apiKey,
        config.environment || 'practice',
        symbol,
        timeframe,
        candleCount
      );

      console.log(`✅ Fetched ${marketData.close.length} real data points for ${symbol}`);
      console.log(`📈 Price range: ${Math.min(...marketData.close).toFixed(5)} - ${Math.max(...marketData.close).toFixed(5)}`);
      console.log(`⏰ Timeframe: ${timeframe} (${candleCount} candles ≈ 24 hours)`);

      return marketData;

    } catch (error) {
      console.error('❌ Failed to fetch real market data:', error);
      console.log('🔄 Falling back to sample data...');
      return this.getSampleMarketData();
    }
  }

  // Helper method to calculate how many candles represent ~24 hours
  private calculateCandlesFor24Hours(timeframe: string): number {
    const minutesIn24Hours = 24 * 60; // 1440 minutes
    
    const timeframeMinutes: { [key: string]: number } = {
      'M1': 1,
      'M2': 2,
      'M5': 5,
      'M15': 15,
      'M30': 30,
      'H1': 60,
      'H2': 120,
      'H4': 240,
      'H8': 480,
      'D': 1440 // Daily
    };

    const minutes = timeframeMinutes[timeframe] || 15; // Default to 15 minutes
    const candleCount = Math.floor(minutesIn24Hours / minutes);
    
    // Cap at reasonable limits
    return Math.min(candleCount, 500);
  }

  // Keep existing sample data method as fallback
  async getSampleMarketData(): Promise<any> {
    // Generate sample OHLCV data for testing
    const sampleData = {
      open: Array.from({length: 100}, (_, i) => 1.1000 + Math.random() * 0.01),
      high: Array.from({length: 100}, (_, i) => 1.1010 + Math.random() * 0.01),
      low: Array.from({length: 100}, (_, i) => 1.0990 + Math.random() * 0.01),
      close: Array.from({length: 100}, (_, i) => 1.1000 + Math.random() * 0.01),
      volume: Array.from({length: 100}, (_, i) => 1000 + Math.random() * 500)
    };

    console.log('📊 Generated sample market data for testing:', {
      dataPoints: sampleData.close.length,
      priceRange: `${Math.min(...sampleData.close).toFixed(4)} - ${Math.max(...sampleData.close).toFixed(4)}`
    });

    return sampleData;
  }

  // Updated method to test with real market data from past 24 hours
  async testCurrentStrategy(symbol: string = 'EUR_USD', timeframe: string = 'M15'): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No user authenticated');
      return null;
    }

    console.log(`🎯 Testing strategy on real ${symbol} data (${timeframe} timeframe)`);

    // Get the most recent strategy from localStorage or use a default
    const savedStrategy = localStorage.getItem('currentStrategy');
    let strategyCode = '';
    
    if (savedStrategy) {
      const strategy = JSON.parse(savedStrategy);
      strategyCode = strategy.code || strategy.strategy_code || '';
    }

    if (!strategyCode) {
      strategyCode = `
# Simple EMA Crossover Strategy
import numpy as np

def strategy_logic():
    close = data['close']
    
    # Calculate EMAs
    ema_fast = pd.Series(close).ewm(span=12).mean().values
    ema_slow = pd.Series(close).ewm(span=26).mean().values
    
    # Generate signals
    entry = np.zeros(len(close), dtype=bool)
    exit = np.zeros(len(close), dtype=bool)
    direction = [None] * len(close)
    
    for i in range(1, len(close)):
        if ema_fast[i] > ema_slow[i] and ema_fast[i-1] <= ema_slow[i-1]:
            entry[i] = True
            direction[i] = 'BUY'
        elif ema_fast[i] < ema_slow[i] and ema_fast[i-1] >= ema_slow[i-1]:
            entry[i] = True
            direction[i] = 'SELL'
    
    return {
        'entry': entry.tolist(),
        'exit': exit.tolist(), 
        'direction': direction
    }

result = strategy_logic()
`;
    }

    // Use real market data instead of sample data
    const marketData = await this.getRealMarketData(symbol, timeframe);
    return await this.testSignalGeneration(strategyCode, marketData);
  }

  // NEW: Simple test function specifically for USDJPY 15min with clear output
  async testUSDJPY15min(): Promise<any> {
    console.log('🎯 Testing simple EMA crossover strategy on USDJPY 15-minute data (last 24 hours)...');
    
    try {
      // Simple EMA crossover strategy
      const simpleStrategy = `
# Simple EMA Crossover Strategy for USDJPY
import numpy as np
import pandas as pd

def strategy_logic():
    close = data['close']
    
    # Calculate EMAs (12 and 26 periods)
    ema_fast = pd.Series(close).ewm(span=12).mean().values
    ema_slow = pd.Series(close).ewm(span=26).mean().values
    
    # Generate signals
    entry = np.zeros(len(close), dtype=bool)
    exit = np.zeros(len(close), dtype=bool)
    direction = [None] * len(close)
    
    for i in range(1, len(close)):
        # BUY when fast EMA crosses above slow EMA
        if ema_fast[i] > ema_slow[i] and ema_fast[i-1] <= ema_slow[i-1]:
            entry[i] = True
            direction[i] = 'BUY'
        # SELL when fast EMA crosses below slow EMA
        elif ema_fast[i] < ema_slow[i] and ema_fast[i-1] >= ema_slow[i-1]:
            entry[i] = True
            direction[i] = 'SELL'
    
    return {
        'entry': entry.tolist(),
        'exit': exit.tolist(), 
        'direction': direction
    }

result = strategy_logic()
`;

      // Get real USDJPY data for 15-minute timeframe
      const marketData = await this.getRealMarketData('USD_JPY', 'M15');
      
      // Test the strategy
      const result = await this.testSignalGeneration(simpleStrategy, marketData);
      
      // Count and display results
      const entryCount = result?.entry?.filter?.(Boolean)?.length || 0;
      const buySignals = result?.direction?.filter?.(d => d === 'BUY')?.length || 0;
      const sellSignals = result?.direction?.filter?.(d => d === 'SELL')?.length || 0;
      
      console.log('📊 USDJPY 15-MINUTE TEST RESULTS:');
      console.log('================================');
      console.log(`📈 Data points analyzed: ${marketData?.close?.length || 0}`);
      console.log(`🚨 Total entry signals: ${entryCount}`);
      console.log(`📈 BUY signals: ${buySignals}`);
      console.log(`📉 SELL signals: ${sellSignals}`);
      console.log(`⏰ Time period: Last 24 hours (15-minute candles)`);
      console.log(`💱 Currency pair: USDJPY`);
      
      if (marketData?.close?.length > 0) {
        console.log(`💰 Price range: ${Math.min(...marketData.close).toFixed(3)} - ${Math.max(...marketData.close).toFixed(3)}`);
        console.log(`📊 Latest price: ${marketData.close[marketData.close.length - 1].toFixed(3)}`);
      }
      
      return {
        symbol: 'USDJPY',
        timeframe: '15min',
        dataPoints: marketData?.close?.length || 0,
        totalEntries: entryCount,
        buySignals,
        sellSignals,
        result
      };
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      return null;
    }
  }

  // NEW: Test any user strategy against live USDJPY 15min data
  async testUserStrategy(strategyCode: string, symbol: string = 'USD_JPY', timeframe: string = 'M15'): Promise<any> {
    console.log(`🎯 Testing USER STRATEGY on ${symbol} ${timeframe} data (last 24 hours)...`);
    console.log(`📝 Strategy code length: ${strategyCode.length} characters`);
    
    try {
      // Get real market data
      const marketData = await this.getRealMarketData(symbol, timeframe);
      
      // Test the user's strategy
      const result = await this.testSignalGeneration(strategyCode, marketData);
      
      // Count and display results
      const entryCount = result?.entry?.filter?.(Boolean)?.length || 0;
      const buySignals = result?.direction?.filter?.(d => d === 'BUY')?.length || 0;
      const sellSignals = result?.direction?.filter?.(d => d === 'SELL')?.length || 0;
      
      console.log('📊 USER STRATEGY TEST RESULTS:');
      console.log('================================');
      console.log(`📈 Data points analyzed: ${marketData?.close?.length || 0}`);
      console.log(`🚨 Total entry signals: ${entryCount}`);
      console.log(`📈 BUY signals: ${buySignals}`);
      console.log(`📉 SELL signals: ${sellSignals}`);
      console.log(`⏰ Time period: Last 24 hours (${timeframe} candles)`);
      console.log(`💱 Currency pair: ${symbol}`);
      
      if (marketData?.close?.length > 0) {
        console.log(`💰 Price range: ${Math.min(...marketData.close).toFixed(3)} - ${Math.max(...marketData.close).toFixed(3)}`);
        console.log(`📊 Latest price: ${marketData.close[marketData.close.length - 1].toFixed(3)}`);
      }

      // Show signal breakdown by time if there are signals
      if (entryCount > 0 && result?.entry && result?.direction) {
        console.log('\n🕐 SIGNAL TIMING BREAKDOWN:');
        console.log('============================');
        for (let i = 0; i < result.entry.length; i++) {
          if (result.entry[i] && result.direction[i]) {
            const candleNumber = i + 1;
            const timeAgo = Math.floor((result.entry.length - i) * 15 / 60); // Approximate hours ago for 15min candles
            console.log(`   📍 Signal ${candleNumber}: ${result.direction[i]} (~${timeAgo}h ago)`);
          }
        }
      }

      // Show additional strategy info if available
      if (result?.reverse_signals_applied !== undefined) {
        console.log(`\n🔄 Reverse signals mode: ${result.reverse_signals_applied ? 'ON' : 'OFF'}`);
      }
      
      return {
        symbol,
        timeframe,
        dataPoints: marketData?.close?.length || 0,
        totalEntries: entryCount,
        buySignals,
        sellSignals,
        priceRange: marketData?.close?.length > 0 ? {
          min: Math.min(...marketData.close),
          max: Math.max(...marketData.close),
          latest: marketData.close[marketData.close.length - 1]
        } : null,
        result
      };
      
    } catch (error) {
      console.error('❌ User strategy test failed:', error);
      return null;
    }
  }
}

// Enhanced debugging tools for browser console
if (typeof window !== 'undefined') {
  const processor = EnhancedSignalProcessor.getInstance();
  (window as any).signalProcessor = processor;
  
  // Test with real market data (default: EUR/USD, 15-minute timeframe)
  (window as any).testStrategy = (symbol?: string, timeframe?: string) => 
    processor.testCurrentStrategy(symbol || 'EUR_USD', timeframe || 'M15');
  
  // Test with sample data
  (window as any).testWithSampleData = (strategyCode: string) => {
    return processor.getSampleMarketData().then(data => 
      processor.testSignalGeneration(strategyCode, data)
    );
  };

  // Test with real data for specific pair/timeframe
  (window as any).testWithRealData = (strategyCode: string, symbol: string = 'EUR_USD', timeframe: string = 'M15') => {
    return processor.getRealMarketData(symbol, timeframe).then(data => 
      processor.testSignalGeneration(strategyCode, data)
    );
  };

  // Simple USDJPY 15min test
  (window as any).testUSDJPY = () => processor.testUSDJPY15min();
  
  // NEW: Test any user strategy on USDJPY 15min
  (window as any).testUserStrategy = (strategyCode: string, symbol?: string, timeframe?: string) => 
    processor.testUserStrategy(strategyCode, symbol || 'USD_JPY', timeframe || 'M15');
  
  console.log('🎯 Enhanced signal testing tools available:');
  console.log('   testUSDJPY() - Test simple EMA strategy on USDJPY 15-min (RECOMMENDED)');
  console.log('   testUserStrategy(code, symbol?, timeframe?) - Test YOUR strategy on live data');
  console.log('   testStrategy(symbol?, timeframe?) - Test current strategy with real market data');
  console.log('   testWithSampleData(code) - Test custom strategy with sample data');
  console.log('   testWithRealData(code, symbol?, timeframe?) - Test custom strategy with real data');
  console.log('   Examples:');
  console.log('     testUSDJPY() - Test USDJPY 15-min with simple EMA crossover');
  console.log('     testUserStrategy(`your_strategy_code`) - Test your strategy on USDJPY 15-min');
  console.log('     testStrategy("GBP_USD", "H1") - Test with GBP/USD hourly data');
}
