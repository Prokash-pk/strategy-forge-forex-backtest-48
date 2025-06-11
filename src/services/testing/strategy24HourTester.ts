
import { OANDAMarketDataService } from '../oandaMarketDataService';
import { OptimizedExecutionManager } from '../python/optimizedExecutionManager';

export class Strategy24HourTester {
  private static instance: Strategy24HourTester;

  static getInstance(): Strategy24HourTester {
    if (!Strategy24HourTester.instance) {
      Strategy24HourTester.instance = new Strategy24HourTester();
    }
    return Strategy24HourTester.instance;
  }

  async test24HourEntries(
    strategyCode: string, 
    symbol: string = 'USD_JPY', 
    timeframe: string = 'M15'
  ): Promise<any> {
    console.log('🎯 TESTING 24-HOUR STRATEGY ENTRIES');
    console.log('=====================================');
    console.log(`📊 Symbol: ${symbol}`);
    console.log(`⏰ Timeframe: ${timeframe}`);
    console.log(`📝 Strategy code length: ${strategyCode.length} characters`);
    console.log('');

    try {
      // Get OANDA config
      const savedConfig = localStorage.getItem('oanda_config');
      if (!savedConfig) {
        throw new Error('No OANDA configuration found. Please configure OANDA connection first.');
      }

      const config = JSON.parse(savedConfig);
      if (!config.accountId || !config.apiKey) {
        throw new Error('Incomplete OANDA configuration. Please check your settings.');
      }

      // Calculate how many candles we need for 24 hours
      const candleCount = this.calculateCandlesFor24Hours(timeframe);
      console.log(`📈 Fetching ${candleCount} candles for ~24 hours of data...`);

      // Fetch real market data from OANDA
      const marketData = await OANDAMarketDataService.fetchLiveMarketData(
        config.accountId,
        config.apiKey,
        config.environment || 'practice',
        symbol,
        timeframe,
        candleCount
      );

      console.log(`✅ Market data fetched: ${marketData.close.length} data points`);
      console.log(`💰 Price range: ${Math.min(...marketData.close).toFixed(5)} - ${Math.max(...marketData.close).toFixed(5)}`);
      console.log(`📊 Latest price: ${marketData.close[marketData.close.length - 1].toFixed(5)}`);
      console.log('');

      // Wrap the strategy code to ensure it returns proper signals
      const wrappedStrategyCode = `
# User's strategy code
${strategyCode}

# Execute the strategy with the provided data
try:
    print("🚀 Executing user strategy...")
    if 'strategy_logic' in locals():
        print("✅ Found strategy_logic function")
        result = strategy_logic(data)
    else:
        print("⚠️ No strategy_logic function found, trying direct execution")
        # Try to execute the code directly and look for common variable names
        exec(strategy_code, globals(), locals())
        
        # Look for common result variable names
        if 'result' in locals():
            result = locals()['result']
        elif 'signals' in locals():
            result = locals()['signals']
        else:
            # Try to construct result from common variables
            entry = locals().get('entry', [])
            exit = locals().get('exit', [])
            direction = locals().get('direction', [])
            
            result = {
                'entry': entry,
                'exit': exit if exit else [False] * len(entry),
                'direction': direction if direction else [None] * len(entry)
            }
    
    print(f"📊 Strategy result type: {type(result)}")
    if hasattr(result, 'keys'):
        print(f"📋 Result keys: {list(result.keys())}")
    
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

      // Execute strategy using optimized execution manager
      const executionManager = OptimizedExecutionManager.getInstance();
      const result = await executionManager.executePythonStrategy(wrappedStrategyCode, marketData);

      // Analyze results
      const analysis = this.analyzeSignals(result, marketData, timeframe);
      
      // Display detailed results
      this.displayResults(analysis, symbol, timeframe);
      
      return analysis;

    } catch (error) {
      console.error('❌ 24-hour strategy test failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        entryCount: 0,
        success: false
      };
    }
  }

  private calculateCandlesFor24Hours(timeframe: string): number {
    const minutesIn24Hours = 24 * 60; // 1440 minutes
    
    const timeframeMinutes: { [key: string]: number } = {
      'M1': 1, 'M2': 2, 'M5': 5, 'M15': 15, 'M30': 30,
      'H1': 60, 'H2': 120, 'H4': 240, 'H8': 480, 'D': 1440
    };

    const minutes = timeframeMinutes[timeframe] || 15;
    const candleCount = Math.floor(minutesIn24Hours / minutes);
    
    // Cap at reasonable limits
    return Math.min(candleCount, 500);
  }

  private analyzeSignals(result: any, marketData: any, timeframe: string): any {
    const entry = result?.entry || [];
    const exit = result?.exit || [];
    const direction = result?.direction || [];
    
    // Count signals
    const totalEntries = entry.filter((signal: boolean) => signal === true).length;
    const totalExits = exit.filter((signal: boolean) => signal === true).length;
    
    // Count by direction
    const buySignals = direction.filter((d: string) => d === 'BUY').length;
    const sellSignals = direction.filter((d: string) => d === 'SELL').length;
    
    // Find signal timing
    const entryTimes: number[] = [];
    for (let i = 0; i < entry.length; i++) {
      if (entry[i] === true) {
        entryTimes.push(i);
      }
    }
    
    // Calculate time between signals
    const timeBetweenSignals = entryTimes.length > 1 
      ? entryTimes.map((time, index) => index > 0 ? time - entryTimes[index - 1] : 0).slice(1)
      : [];
    
    const avgTimeBetweenSignals = timeBetweenSignals.length > 0
      ? timeBetweenSignals.reduce((a, b) => a + b, 0) / timeBetweenSignals.length
      : 0;

    return {
      success: true,
      dataPoints: marketData?.close?.length || 0,
      timeframe,
      totalEntries,
      totalExits,
      buySignals,
      sellSignals,
      entryTimes,
      avgTimeBetweenSignals,
      avgMinutesBetweenSignals: this.candlesToMinutes(avgTimeBetweenSignals, timeframe),
      priceRange: marketData?.close?.length > 0 ? {
        min: Math.min(...marketData.close),
        max: Math.max(...marketData.close),
        latest: marketData.close[marketData.close.length - 1]
      } : null,
      result,
      error: result?.error
    };
  }

  private candlesToMinutes(candles: number, timeframe: string): number {
    const timeframeMinutes: { [key: string]: number } = {
      'M1': 1, 'M2': 2, 'M5': 5, 'M15': 15, 'M30': 30,
      'H1': 60, 'H2': 120, 'H4': 240, 'H8': 480, 'D': 1440
    };
    
    const minutes = timeframeMinutes[timeframe] || 15;
    return candles * minutes;
  }

  private displayResults(analysis: any, symbol: string, timeframe: string): void {
    console.log('🎯 24-HOUR STRATEGY ANALYSIS RESULTS');
    console.log('====================================');
    console.log(`💱 Pair: ${symbol}`);
    console.log(`⏰ Timeframe: ${timeframe}`);
    console.log(`📊 Data points analyzed: ${analysis.dataPoints}`);
    console.log('');
    
    console.log('🚨 ENTRY SIGNAL SUMMARY:');
    console.log(`   Total entries: ${analysis.totalEntries}`);
    console.log(`   📈 BUY signals: ${analysis.buySignals}`);
    console.log(`   📉 SELL signals: ${analysis.sellSignals}`);
    console.log(`   🔄 Exit signals: ${analysis.totalExits}`);
    console.log('');
    
    if (analysis.totalEntries > 0) {
      console.log('⏱️ TIMING ANALYSIS:');
      console.log(`   Average time between signals: ${analysis.avgMinutesBetweenSignals.toFixed(1)} minutes`);
      console.log(`   Signal frequency: ${(24 * 60 / analysis.avgMinutesBetweenSignals).toFixed(1)} signals per day`);
      console.log('');
      
      console.log('📍 SIGNAL POSITIONS:');
      analysis.entryTimes.forEach((time: number, index: number) => {
        const hoursAgo = Math.floor((analysis.dataPoints - time) * analysis.avgMinutesBetweenSignals / 60);
        const signalDirection = analysis.result?.direction?.[time] || 'UNKNOWN';
        console.log(`   Signal ${index + 1}: ${signalDirection} (${hoursAgo}h ago, candle ${time})`);
      });
    } else {
      console.log('⚠️ NO ENTRY SIGNALS DETECTED in the last 24 hours');
      console.log('   Consider adjusting strategy parameters or timeframe');
    }
    
    if (analysis.priceRange) {
      console.log('');
      console.log('💰 PRICE INFORMATION:');
      console.log(`   Price range: ${analysis.priceRange.min.toFixed(5)} - ${analysis.priceRange.max.toFixed(5)}`);
      console.log(`   Latest price: ${analysis.priceRange.latest.toFixed(5)}`);
      console.log(`   24h range: ${((analysis.priceRange.max - analysis.priceRange.min) / analysis.priceRange.min * 100).toFixed(3)}%`);
    }
    
    if (analysis.error) {
      console.log('');
      console.log('❌ STRATEGY ERROR:');
      console.log(`   ${analysis.error}`);
    }
  }
}

// Bind to window for easy testing
if (typeof window !== 'undefined') {
  const tester = Strategy24HourTester.getInstance();
  (window as any).test24HourEntries = tester.test24HourEntries.bind(tester);
  
  console.log('🎯 24-Hour Strategy Tester Available!');
  console.log('====================================');
  console.log('Usage: test24HourEntries(strategyCode, symbol?, timeframe?)');
  console.log('');
  console.log('Examples:');
  console.log('  test24HourEntries(`your_strategy_code`)');
  console.log('  test24HourEntries(`your_code`, "EUR_USD", "M30")');
  console.log('  test24HourEntries(`your_code`, "GBP_USD", "H1")');
}
