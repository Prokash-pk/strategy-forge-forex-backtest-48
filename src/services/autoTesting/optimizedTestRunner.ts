
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

// Cache for market data to reduce API calls
class MarketDataCache {
  private cache = new Map<string, { data: any; timestamp: number; }>();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  getCacheKey(symbol: string, timeframe: string, candleCount: number): string {
    return `${symbol}-${timeframe}-${candleCount}`;
  }

  get(symbol: string, timeframe: string, candleCount: number): any | null {
    const key = this.getCacheKey(symbol, timeframe, candleCount);
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheDuration) {
      console.log(`📋 Using cached market data for ${symbol}`);
      return cached.data;
    }
    
    return null;
  }

  set(symbol: string, timeframe: string, candleCount: number, data: any): void {
    const key = this.getCacheKey(symbol, timeframe, candleCount);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Clean old cache entries
    this.cleanup();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if ((now - value.timestamp) > this.cacheDuration) {
        this.cache.delete(key);
      }
    }
  }
}

export class OptimizedStrategyTestRunner {
  private static marketDataCache = new MarketDataCache();
  private static lastExecutionTime = new Map<string, number>();
  private static minExecutionInterval = 10 * 60 * 1000; // 10 minutes minimum between executions

  static async runSingleTest(
    strategyCode: string,
    config: StrategyTestConfig
  ): Promise<StrategyTestResult> {
    try {
      // Check if we should skip this execution to reduce load
      const executionKey = `${config.symbol}-${config.timeframe}`;
      const lastExecution = this.lastExecutionTime.get(executionKey) || 0;
      const now = Date.now();
      
      if ((now - lastExecution) < this.minExecutionInterval) {
        console.log(`⏳ Skipping execution for ${config.symbol} - too soon (${Math.floor((this.minExecutionInterval - (now - lastExecution)) / 1000)}s remaining)`);
        
        // Return a cached result or minimal result
        return {
          hasSignals: false,
          entryCount: 0,
          exitCount: 0,
          directions: [],
          confidence: 0,
          technicalIndicators: null,
          rawResult: null,
          error: 'Execution throttled to reduce data usage'
        };
      }

      console.log(`🔍 Testing strategy on ${config.symbol} (${config.timeframe})`);

      // Try to get cached market data first
      let marketData = this.marketDataCache.get(config.symbol, config.timeframe, config.candleCount);
      
      if (!marketData) {
        // Fetch market data only if not cached
        console.log(`📊 Fetching new market data for ${config.symbol}`);
        marketData = await OANDAMarketDataService.fetchLiveMarketData(
          'dummy-account',
          'dummy-key', 
          'practice',
          config.symbol,
          config.timeframe,
          Math.min(config.candleCount, 50) // Reduce candle count to save bandwidth
        );
        
        // Cache the data
        this.marketDataCache.set(config.symbol, config.timeframe, config.candleCount, marketData);
      }

      console.log(`📊 Using ${marketData.close.length} data points`);

      // Execute strategy
      const rawResult = await PythonExecutor.executeStrategy(strategyCode, marketData);

      // Process and validate results
      const result = this.processTestResult(rawResult, config);

      // Update last execution time
      this.lastExecutionTime.set(executionKey, now);

      // Log results (reduced verbosity)
      if (result.hasSignals) {
        console.log(`🚨 ${config.symbol}: ${result.directions.join(', ')} signal (${(result.confidence * 100).toFixed(1)}% confidence)`);
      } else {
        console.log(`🔍 ${config.symbol}: No signals detected`);
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
    const stringDirections = direction
      .filter((d: any) => d && d !== 'None')
      .map((d: any) => String(d)) as string[];
    
    const uniqueDirections: string[] = Array.from(new Set(stringDirections));

    // Calculate confidence
    const confidence = rawResult.confidence 
      ? rawResult.confidence.reduce((sum: number, c: number) => sum + c, 0) / rawResult.confidence.length
      : entryCount > 0 ? 0.5 : 0;

    // Extract technical indicators (only latest values to reduce data)
    const technicalIndicators: any = {};
    Object.keys(rawResult).forEach(key => {
      if (!['entry', 'exit', 'direction', 'confidence', 'error'].includes(key)) {
        const value = rawResult[key];
        if (Array.isArray(value) && value.length > 0) {
          technicalIndicators[key] = value[value.length - 1]; // Get latest value only
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
      rawResult: null, // Don't store raw result to save space
      error: rawResult.error
    };
  }

  // Method to clear cache if needed
  static clearCache(): void {
    this.marketDataCache = new MarketDataCache();
    console.log('🗑️ Market data cache cleared');
  }

  // Method to get cache stats
  static getCacheStats(): any {
    return {
      cacheSize: this.marketDataCache['cache'].size,
      lastExecutions: Array.from(this.lastExecutionTime.entries())
    };
  }
}
