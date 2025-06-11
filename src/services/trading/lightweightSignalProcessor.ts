
import { supabase } from '@/integrations/supabase/client';
import { OptimizedExecutionManager } from '../python/optimizedExecutionManager';
import { OANDAMarketDataService } from '../oandaMarketDataService';

export class LightweightSignalProcessor {
  private static instance: LightweightSignalProcessor;

  static getInstance(): LightweightSignalProcessor {
    if (!LightweightSignalProcessor.instance) {
      LightweightSignalProcessor.instance = new LightweightSignalProcessor();
    }
    return LightweightSignalProcessor.instance;
  }

  async getRealMarketData(symbol: string = 'EUR_USD', timeframe: string = 'M15'): Promise<any> {
    try {
      console.log(`📊 Fetching real market data for ${symbol} (${timeframe})`);
      
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
      return marketData;

    } catch (error) {
      console.error('❌ Failed to fetch real market data:', error);
      console.log('🔄 Falling back to sample data...');
      return this.getSampleMarketData();
    }
  }

  private calculateCandlesFor24Hours(timeframe: string): number {
    const minutesIn24Hours = 24 * 60;
    const timeframeMinutes: { [key: string]: number } = {
      'M1': 1, 'M2': 2, 'M5': 5, 'M15': 15, 'M30': 30,
      'H1': 60, 'H2': 120, 'H4': 240, 'H8': 480, 'D': 1440
    };

    const minutes = timeframeMinutes[timeframe] || 15;
    const candleCount = Math.floor(minutesIn24Hours / minutes);
    return Math.min(candleCount, 500);
  }

  async getSampleMarketData(): Promise<any> {
    // Generate sample OHLCV data for testing
    const length = 100;
    const basePrice = 1.1000;
    
    const sampleData = {
      open: [],
      high: [],
      low: [],
      close: [],
      volume: [],
      Open: [],
      High: [],
      Low: [],
      Close: [],
      Volume: []
    };

    // Generate realistic price movements
    let currentPrice = basePrice;
    for (let i = 0; i < length; i++) {
      // Random walk with some trend
      const change = (Math.random() - 0.5) * 0.002; // ±0.1% max change
      currentPrice = Math.max(0.9000, Math.min(1.3000, currentPrice + change));
      
      const open = currentPrice;
      const high = currentPrice + Math.random() * 0.001;
      const low = currentPrice - Math.random() * 0.001;
      const close = low + Math.random() * (high - low);
      const volume = 1000 + Math.random() * 500;

      // Both lowercase and uppercase for compatibility
      sampleData.open.push(open);
      sampleData.high.push(high);
      sampleData.low.push(low);
      sampleData.close.push(close);
      sampleData.volume.push(volume);

      sampleData.Open.push(open);
      sampleData.High.push(high);
      sampleData.Low.push(low);
      sampleData.Close.push(close);
      sampleData.Volume.push(volume);

      currentPrice = close;
    }

    console.log('📊 Generated sample market data for testing');
    return sampleData;
  }

  async testUserStrategy(strategyCode: string, symbol: string = 'USD_JPY', timeframe: string = 'M15'): Promise<any> {
    console.log(`🎯 Testing USER STRATEGY on ${symbol} ${timeframe} data (LIGHTWEIGHT MODE)`);
    console.log(`📝 Strategy code length: ${strategyCode.length} characters`);
    
    try {
      // Get real market data
      const marketData = await this.getRealMarketData(symbol, timeframe);
      
      // Use optimized execution manager with FIXED strategy code
      const executionManager = OptimizedExecutionManager.getInstance();
      
      // IMPORTANT: Wrap the strategy code to call it properly with data
      const wrappedStrategyCode = `
# User's strategy code
${strategyCode}

# Execute the strategy with the provided data
try:
    if 'strategy_logic' in locals():
        print("🎯 Found strategy_logic function, calling with data...")
        result = strategy_logic(data)
        print(f"✅ Strategy executed successfully, result type: {type(result)}")
    else:
        print("⚠️ No strategy_logic function found, returning empty result")
        result = {
            'entry': [False] * len(data.get('close', [])),
            'exit': [False] * len(data.get('close', [])),
            'direction': [None] * len(data.get('close', []))
        }
except Exception as e:
    print(f"❌ Strategy execution error: {e}")
    import traceback
    traceback.print_exc()
    result = {
        'entry': [False] * len(data.get('close', [])),
        'exit': [False] * len(data.get('close', [])),
        'direction': [None] * len(data.get('close', [])),
        'error': str(e)
    }

# Return the result
result
`;
      
      const result = await executionManager.executePythonStrategy(wrappedStrategyCode, marketData);
      
      // Count and display results
      const entryCount = result?.entry?.filter?.(Boolean)?.length || 0;
      const buySignals = result?.direction?.filter?.(d => d === 'BUY')?.length || 0;
      const sellSignals = result?.direction?.filter?.(d => d === 'SELL')?.length || 0;
      
      console.log('📊 LIGHTWEIGHT STRATEGY TEST RESULTS:');
      console.log('=====================================');
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
            const timeAgo = Math.floor((result.entry.length - i) * 15 / 60);
            console.log(`   📍 Signal ${candleNumber}: ${result.direction[i]} (~${timeAgo}h ago)`);
          }
        }
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
      console.error('❌ Lightweight strategy test failed:', error);
      return null;
    }
  }
}

// IMMEDIATE WINDOW BINDING - Execute immediately when this file loads
if (typeof window !== 'undefined') {
  console.log('🔧 Binding lightweight strategy functions to window...');
  
  // Create processor instance immediately
  const lightweightProcessor = LightweightSignalProcessor.getInstance();
  
  // Bind to window object immediately
  (window as any).lightweightProcessor = lightweightProcessor;
  
  // Bind test functions immediately with proper error handling
  (window as any).testUserStrategy = async function(strategyCode: string, symbol?: string, timeframe?: string) {
    try {
      console.log('🚀 Starting lightweight strategy test...');
      return await lightweightProcessor.testUserStrategy(strategyCode, symbol || 'USD_JPY', timeframe || 'M15');
    } catch (error) {
      console.error('❌ Strategy test error:', error);
      return null;
    }
  };
  
  (window as any).quickTest = async function() {
    try {
      console.log('🚀 Running quick EMA crossover test...');
      const simpleStrategy = `
def strategy_logic(data):
    close = data['Close']
    
    # Simple EMA crossover
    short_ema = TechnicalAnalysis.ema(close, 12)
    long_ema = TechnicalAnalysis.ema(close, 26)
    
    entry = []
    direction = []
    
    for i in range(len(close)):
        if i < 26:
            entry.append(False)
            direction.append(None)
        else:
            # BUY when fast EMA crosses above slow EMA
            if short_ema[i] > long_ema[i] and short_ema[i-1] <= long_ema[i-1]:
                entry.append(True)
                direction.append('BUY')
            # SELL when fast EMA crosses below slow EMA
            elif short_ema[i] < long_ema[i] and short_ema[i-1] >= long_ema[i-1]:
                entry.append(True)
                direction.append('SELL')
            else:
                entry.append(False)
                direction.append(None)
    
    return {
        'entry': entry,
        'exit': [False] * len(close),
        'direction': direction
    }
`;
      return await lightweightProcessor.testUserStrategy(simpleStrategy);
    } catch (error) {
      console.error('❌ Quick test error:', error);
      return null;
    }
  };
  
  // Log immediately when functions are bound
  console.log('✅ LIGHTWEIGHT Strategy Testing Functions Available:');
  console.log('====================================================');
  console.log('📝 testUserStrategy(code, symbol?, timeframe?) - Test your strategy');
  console.log('⚡ quickTest() - Test simple EMA crossover');
  console.log('🔧 lightweightProcessor - Direct access to processor');
  console.log('');
  console.log('💡 Memory-optimized for browser testing!');
  console.log('🎯 Try: quickTest() or testUserStrategy(`your_code_here`)');
}
