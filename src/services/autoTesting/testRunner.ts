
import { OANDAMarketDataService } from '../oandaMarketDataService';
import { PythonExecutor } from '../pythonExecutor';

export interface StrategyTestConfig {
  symbol: string;
  timeframe: string;
  candleCount: number;
  reverseSignals?: boolean;
}

export interface StrategyTestResult {
  hasSignals: boolean;
  entryCount: number;
  exitCount: number;
  directions: string[];
  confidence: number;
  technicalIndicators: any;
  rawResult: any;
  error?: string;
}

export class StrategyTestRunner {
  static async runSingleTest(
    strategyCode: string,
    config: StrategyTestConfig
  ): Promise<StrategyTestResult> {
    try {
      console.log(`🔍 Testing strategy on ${config.symbol} (${config.timeframe})`);

      // Fetch market data
      const marketData = await OANDAMarketDataService.fetchLiveMarketData(
        'dummy-account',
        'dummy-key', 
        'practice',
        config.symbol,
        config.timeframe,
        config.candleCount
      );

      console.log(`📊 Fetched ${marketData.close.length} data points`);

      // Execute strategy
      const rawResult = await PythonExecutor.executeStrategy(strategyCode, marketData);

      // Process and validate results
      const result = this.processTestResult(rawResult, config);

      console.log('🔬 Strategy Analysis Results:');
      console.log(`   Entry Signal: ${result.hasSignals ? '✅ YES' : '❌ NO'}`);
      console.log(`   Exit Signal: ${result.exitCount > 0 ? '✅ YES' : '❌ NO'}`);
      console.log(`   Trade Direction: ${result.directions.join(', ') || 'NONE'}`);
      console.log(`   Signal Confidence: ${(result.confidence * 100).toFixed(1)}%`);

      if (result.technicalIndicators) {
        console.log('📊 Technical Indicators:');
        Object.entries(result.technicalIndicators).forEach(([key, value]) => {
          if (typeof value === 'number') {
            console.log(`   ${key}: ${value.toFixed(4)}`);
          }
        });
      }

      if (result.hasSignals) {
        console.log('🚨 Trade signals detected!');
      } else {
        console.log('🔍 No trade signals detected - monitoring continues...');
      }

      return result;

    } catch (error) {
      console.error('❌ Strategy test failed:', error);
      return {
        hasSignals: false,
        entryCount: 0,
        exitCount: 0,
        directions: [],
        confidence: 0,
        technicalIndicators: null,
        rawResult: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static processTestResult(rawResult: any, config: StrategyTestConfig): StrategyTestResult {
    const entry = rawResult.entry || [];
    const exit = rawResult.exit || [];
    const direction = rawResult.direction || [];

    // Count actual signals
    const entryCount = entry.filter(Boolean).length;
    const exitCount = exit.filter(Boolean).length;

    // Get unique directions and ensure they are strings
    const uniqueDirections = [...new Set(
      direction
        .filter((d: any) => d && d !== 'None')
        .map((d: any) => String(d)) // Convert to string to fix type issue
    )];

    // Calculate confidence
    const confidence = rawResult.confidence 
      ? rawResult.confidence.reduce((sum: number, c: number) => sum + c, 0) / rawResult.confidence.length
      : entryCount > 0 ? 0.5 : 0;

    // Extract technical indicators
    const technicalIndicators: any = {};
    Object.keys(rawResult).forEach(key => {
      if (!['entry', 'exit', 'direction', 'confidence', 'error'].includes(key)) {
        const value = rawResult[key];
        if (Array.isArray(value) && value.length > 0) {
          technicalIndicators[key] = value[value.length - 1]; // Get latest value
        }
      }
    });

    return {
      hasSignals: entryCount > 0,
      entryCount,
      exitCount,
      directions: uniqueDirections,
      confidence,
      technicalIndicators,
      rawResult,
      error: rawResult.error
    };
  }
}
