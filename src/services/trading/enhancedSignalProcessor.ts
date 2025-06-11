
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

  // Add method to get sample market data for testing
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

  // Add method to test with current strategy from strategy builder
  async testCurrentStrategy(): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No user authenticated');
      return null;
    }

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

    const marketData = await this.getSampleMarketData();
    return await this.testSignalGeneration(strategyCode, marketData);
  }
}

// Bind to window for debugging - with better naming and helper functions
if (typeof window !== 'undefined') {
  const processor = EnhancedSignalProcessor.getInstance();
  (window as any).signalProcessor = processor;
  (window as any).testStrategy = () => processor.testCurrentStrategy();
  (window as any).testWithSampleData = (strategyCode: string) => {
    return processor.getSampleMarketData().then(data => 
      processor.testSignalGeneration(strategyCode, data)
    );
  };
  
  console.log('🎯 Signal testing tools available:');
  console.log('   signalProcessor - Full signal processor instance');
  console.log('   testStrategy() - Test current strategy with sample data');
  console.log('   testWithSampleData(code) - Test custom strategy code');
}
