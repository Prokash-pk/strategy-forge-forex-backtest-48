
import { OANDAConfig, StrategySettings } from '@/types/oanda';
import { OptimizedStrategyTestRunner, StrategyTestConfig } from './optimizedTestRunner';
import { TestLogger } from './testLogger';
import { ConsoleLogger } from './consoleLogger';
import { AutoTestResult } from './types';

export class OptimizedAutoStrategyTester {
  private static instance: OptimizedAutoStrategyTester;
  private testInterval: NodeJS.Timeout | null = null;
  private loggingInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private currentConfig: OANDAConfig | null = null;
  private currentStrategy: StrategySettings | null = null;
  private isForwardTestingActive: boolean = false;
  private lastLogTime: number = 0;
  private logFrequencyMs: number = 15 * 60 * 1000; // Increased to 15 minutes
  private testFrequencyMs: number = 15 * 60 * 1000; // Increased to 15 minutes

  static getInstance(): OptimizedAutoStrategyTester {
    if (!OptimizedAutoStrategyTester.instance) {
      OptimizedAutoStrategyTester.instance = new OptimizedAutoStrategyTester();
      OptimizedAutoStrategyTester.instance.bindToWindow();
    }
    return OptimizedAutoStrategyTester.instance;
  }

  private bindToWindow() {
    if (typeof window !== 'undefined') {
      (window as any).optimizedAutoTester = this;
      (window as any).clearMarketDataCache = () => OptimizedStrategyTestRunner.clearCache();
      (window as any).getCacheStats = () => OptimizedStrategyTestRunner.getCacheStats();
      (window as any).setTestFrequency = (minutes: number) => this.setTestFrequency(minutes);
      
      console.log('🧪 Optimized Debug functions available:');
      console.log('   - optimizedAutoTester.getStatus()');
      console.log('   - clearMarketDataCache()');
      console.log('   - getCacheStats()');
      console.log('   - setTestFrequency(minutes)');
    }
  }

  async startAutoTesting(
    config: OANDAConfig,
    strategy: StrategySettings,
    intervalSeconds: number = 900 // Default 15 minutes
  ) {
    if (this.isRunning) {
      console.log('🔄 Optimized auto-testing already running');
      return;
    }

    this.isRunning = true;
    this.currentConfig = config;
    this.currentStrategy = strategy;
    this.lastLogTime = 0;
    this.testFrequencyMs = intervalSeconds * 1000;
    
    ConsoleLogger.setConfiguration(config, strategy);
    TestLogger.logTestStart(strategy.strategy_name, strategy.symbol, intervalSeconds);

    console.log('🚀 OptimizedAutoStrategyTester started');
    console.log('📊 Strategy:', strategy.strategy_name);
    console.log('📈 Symbol:', strategy.symbol);
    console.log('⏰ Test Interval:', intervalSeconds, 'seconds (optimized for lower data usage)');
    console.log('📝 Console logging every 15 minutes');

    this.bindToWindow();

    // Initial test with delay
    setTimeout(async () => {
      if (this.isRunning && this.currentConfig && this.currentStrategy) {
        await this.runTest();
      }
    }, 30000); // 30 second delay

    // Set up periodic testing with optimized intervals
    this.testInterval = setInterval(async () => {
      if (this.isRunning && this.currentConfig && this.currentStrategy) {
        await this.runTest();
      }
    }, this.testFrequencyMs);

    this.startConsoleLogging();
  }

  private async runTest() {
    if (!this.currentConfig || !this.currentStrategy) return;
    
    const testConfig: StrategyTestConfig = {
      symbol: this.currentStrategy.symbol,
      timeframe: this.currentStrategy.timeframe || 'M15',
      candleCount: 50 // Reduced from 100 to save bandwidth
    };
    
    await OptimizedStrategyTestRunner.runSingleTest(this.currentStrategy.strategy_code, testConfig);
  }

  private startConsoleLogging() {
    if (this.loggingInterval) {
      clearInterval(this.loggingInterval);
    }

    console.log('📝 Starting optimized console logging - updates every 15 minutes');

    setTimeout(() => {
      if (this.isRunning && this.currentConfig && this.currentStrategy) {
        ConsoleLogger.runConsoleLogCycle();
        this.lastLogTime = Date.now();
      }
    }, 60000); // 1 minute initial delay

    this.loggingInterval = setInterval(async () => {
      const now = Date.now();
      if (this.isRunning && this.currentConfig && this.currentStrategy && 
          (now - this.lastLogTime) >= this.logFrequencyMs) {
        console.log('🔄 Running optimized console log cycle...');
        await ConsoleLogger.runConsoleLogCycle();
        this.lastLogTime = now;
      }
    }, this.logFrequencyMs);
  }

  stopAutoTesting() {
    if (this.testInterval) {
      clearInterval(this.testInterval);
      this.testInterval = null;
    }
    
    if (this.loggingInterval) {
      clearInterval(this.loggingInterval);
      this.loggingInterval = null;
    }
    
    this.isRunning = false;
    this.currentConfig = null;
    this.currentStrategy = null;
    this.lastLogTime = 0;
    
    ConsoleLogger.clearConfiguration();
    TestLogger.logTestStop();
    
    console.log('🛑 OptimizedAutoStrategyTester stopped');
    this.bindToWindow();
  }

  async runSingleTest(config: OANDAConfig, strategy: StrategySettings): Promise<AutoTestResult> {
    const testConfig: StrategyTestConfig = {
      symbol: strategy.symbol,
      timeframe: strategy.timeframe || 'M15',
      candleCount: 50 // Reduced candle count
    };
    
    const testResult = await OptimizedStrategyTestRunner.runSingleTest(strategy.strategy_code, testConfig);
    
    const autoTestResult: AutoTestResult = {
      timestamp: new Date().toISOString(),
      symbol: strategy.symbol,
      currentPrice: 0,
      candleData: [], // Don't store candle data to save space
      strategySignals: {
        hasSignals: testResult.hasSignals,
        entryCount: testResult.entryCount,
        exitCount: testResult.exitCount,
        directions: testResult.directions,
        confidence: testResult.confidence,
        technicalIndicators: testResult.technicalIndicators,
        rawResult: null, // Don't store raw result
        error: testResult.error
      }
    };
    
    return autoTestResult;
  }

  isActive(): boolean {
    return this.isRunning;
  }

  setTestFrequency(minutes: number) {
    this.testFrequencyMs = minutes * 60 * 1000;
    this.logFrequencyMs = minutes * 60 * 1000;
    console.log(`🕒 Test frequency updated to ${minutes} minutes`);
    
    if (this.isRunning) {
      console.log('🔄 Restart testing to apply new frequency');
    }
  }

  getStatus() {
    const nextLogIn = this.lastLogTime > 0 ? 
      Math.max(0, this.logFrequencyMs - (Date.now() - this.lastLogTime)) : 
      this.logFrequencyMs;
    
    const cacheStats = OptimizedStrategyTestRunner.getCacheStats();
    
    const status = {
      isRunning: this.isRunning,
      hasInterval: !!this.testInterval,
      hasLoggingInterval: !!this.loggingInterval,
      currentStrategy: this.currentStrategy?.strategy_name || null,
      currentSymbol: this.currentStrategy?.symbol || null,
      isForwardTestingActive: this.isForwardTestingActive,
      nextLogInSeconds: Math.floor(nextLogIn / 1000),
      logFrequencyMinutes: this.logFrequencyMs / (60 * 1000),
      testFrequencyMinutes: this.testFrequencyMs / (60 * 1000),
      cacheStats,
      currentConfig: this.currentConfig ? {
        accountId: this.currentConfig.accountId,
        environment: this.currentConfig.environment,
        hasApiKey: !!this.currentConfig.apiKey
      } : null
    };

    console.log('🔍 OptimizedAutoStrategyTester Status:', status);
    return status;
  }

  setForwardTestingStatus(isActive: boolean) {
    this.isForwardTestingActive = isActive;
    console.log(`🔄 Forward testing status updated: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
  }

  autoStart(config: OANDAConfig, strategy: StrategySettings, isForwardTestingActive: boolean) {
    this.setForwardTestingStatus(isForwardTestingActive);
    
    if (!this.isRunning && config && strategy && isForwardTestingActive) {
      console.log('🎯 Auto-starting OptimizedAutoStrategyTester - reduced data usage mode');
      console.log('📝 Console logs every 15 minutes, market data cached for 5 minutes');
      this.startAutoTesting(config, strategy, 900); // 15 minutes
    } else if (this.isRunning && !isForwardTestingActive) {
      console.log('⏸️ Auto-stopping OptimizedAutoStrategyTester');
      this.stopAutoTesting();
    }
  }
}
