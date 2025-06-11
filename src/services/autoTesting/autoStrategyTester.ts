import { OANDAConfig, StrategySettings } from '@/types/oanda';
import { StrategyTestRunner, StrategyTestConfig } from './testRunner';
import { TestLogger } from './testLogger';
import { ConsoleLogger } from './consoleLogger';
import { AutoTestResult } from './types';

export class AutoStrategyTester {
  private static instance: AutoStrategyTester;
  private testInterval: NodeJS.Timeout | null = null;
  private loggingInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private currentConfig: OANDAConfig | null = null;
  private currentStrategy: StrategySettings | null = null;
  private isForwardTestingActive: boolean = false;
  private lastLogTime: number = 0;
  private logFrequencyMs: number = 5 * 60 * 1000; // 5 minutes instead of 1 minute

  static getInstance(): AutoStrategyTester {
    if (!AutoStrategyTester.instance) {
      AutoStrategyTester.instance = new AutoStrategyTester();
      // Bind to window immediately when instance is created
      AutoStrategyTester.instance.bindToWindow();
    }
    return AutoStrategyTester.instance;
  }

  // Ensure global bindings are set up
  private bindToWindow() {
    if (typeof window !== 'undefined') {
      (window as any).autoStrategyTester = this;
      (window as any).runStrategyLogger = () => this.manualConsoleTest();
      (window as any).testLiveTradingCycle = () => ConsoleLogger.runConsoleLogCycle();
      (window as any).liveConsoleLogger = ConsoleLogger;
      (window as any).setLogFrequency = (minutes: number) => this.setLogFrequency(minutes);
      
      console.log('🧪 Debug functions available:');
      console.log('   - autoStrategyTester.getStatus()');
      console.log('   - testLiveTradingCycle()');
      console.log('   - runStrategyLogger()');
      console.log('   - liveConsoleLogger.getStatus()');
      console.log('   - setLogFrequency(minutes)');
    }
  }

  async startAutoTesting(
    config: OANDAConfig,
    strategy: StrategySettings,
    intervalSeconds: number = 300 // Increased to 5 minutes
  ) {
    if (this.isRunning) {
      console.log('🔄 Auto-testing already running');
      return;
    }

    this.isRunning = true;
    this.currentConfig = config;
    this.currentStrategy = strategy;
    this.lastLogTime = 0; // Reset log timer
    
    // Configure console logger
    ConsoleLogger.setConfiguration(config, strategy);
    
    TestLogger.logTestStart(strategy.strategy_name, strategy.symbol, intervalSeconds);

    console.log('🚀 AutoStrategyTester started');
    console.log('📊 Strategy:', strategy.strategy_name);
    console.log('📈 Symbol:', strategy.symbol);
    console.log('⏰ Test Interval:', intervalSeconds, 'seconds');
    console.log('📝 Console logging enabled - detailed evaluations every 5 minutes');

    // Ensure global bindings are available
    this.bindToWindow();

    // Initial test (delayed to avoid startup spam)
    setTimeout(async () => {
      if (this.isRunning && this.currentConfig && this.currentStrategy) {
        await this.runTest();
      }
    }, 10000); // 10 second delay

    // Set up periodic testing with longer intervals
    this.testInterval = setInterval(async () => {
      if (this.isRunning && this.currentConfig && this.currentStrategy) {
        await this.runTest();
      }
    }, intervalSeconds * 1000);

    // Start the console logging cycle (every 5 minutes)
    this.startConsoleLogging();
  }

  private async runTest() {
    if (!this.currentConfig || !this.currentStrategy) return;
    
    const testConfig: StrategyTestConfig = {
      symbol: this.currentStrategy.symbol,
      timeframe: this.currentStrategy.timeframe || 'M15',
      candleCount: 100
    };
    
    await StrategyTestRunner.runSingleTest(this.currentStrategy.strategy_code, testConfig);
  }

  private startConsoleLogging() {
    if (this.loggingInterval) {
      clearInterval(this.loggingInterval);
    }

    console.log('📝 Starting enhanced console logging - updates every 5 minutes');
    console.log('🕒 Next log will appear in 30 seconds...');

    // Start logging after a delay to give time for setup
    setTimeout(() => {
      if (this.isRunning && this.currentConfig && this.currentStrategy) {
        ConsoleLogger.runConsoleLogCycle();
        this.lastLogTime = Date.now();
      }
    }, 30000); // 30 seconds initial delay

    // Set up periodic console logging every 5 minutes
    this.loggingInterval = setInterval(async () => {
      const now = Date.now();
      if (this.isRunning && this.currentConfig && this.currentStrategy && 
          (now - this.lastLogTime) >= this.logFrequencyMs) {
        console.log('🔄 Running scheduled console log cycle...');
        await ConsoleLogger.runConsoleLogCycle();
        this.lastLogTime = now;
      }
    }, this.logFrequencyMs); // Every 5 minutes
  }

  // Manual test function for debugging
  async manualConsoleTest() {
    if (!this.currentConfig || !this.currentStrategy) {
      console.error('❌ No strategy configured for manual test');
      return;
    }
    
    console.log('🧪 Running manual console test...');
    await ConsoleLogger.runConsoleLogCycle();
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
    
    // Clear console logger configuration
    ConsoleLogger.clearConfiguration();
    
    TestLogger.logTestStop();
    console.log('🛑 AutoStrategyTester stopped');
    console.log('🛑 Console logging stopped');

    // Keep global bindings for debugging even when stopped
    this.bindToWindow();
  }

  async runSingleTest(config: OANDAConfig, strategy: StrategySettings): Promise<AutoTestResult> {
    const testConfig: StrategyTestConfig = {
      symbol: strategy.symbol,
      timeframe: strategy.timeframe || 'M15',
      candleCount: 100
    };
    
    const testResult = await StrategyTestRunner.runSingleTest(strategy.strategy_code, testConfig);
    
    // Convert StrategyTestResult to AutoTestResult
    const autoTestResult: AutoTestResult = {
      timestamp: new Date().toISOString(),
      symbol: strategy.symbol,
      currentPrice: 0, // Will be updated with real data
      candleData: [],
      strategySignals: {
        hasSignals: testResult.hasSignals,
        entryCount: testResult.entryCount,
        exitCount: testResult.exitCount,
        directions: testResult.directions,
        confidence: testResult.confidence,
        technicalIndicators: testResult.technicalIndicators,
        rawResult: testResult.rawResult,
        error: testResult.error
      }
    };
    
    return autoTestResult;
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getStatus() {
    const nextLogIn = this.lastLogTime > 0 ? 
      Math.max(0, this.logFrequencyMs - (Date.now() - this.lastLogTime)) : 
      this.logFrequencyMs;
    
    const status = {
      isRunning: this.isRunning,
      hasInterval: !!this.testInterval,
      hasLoggingInterval: !!this.loggingInterval,
      currentStrategy: this.currentStrategy?.strategy_name || null,
      currentSymbol: this.currentStrategy?.symbol || null,
      isForwardTestingActive: this.isForwardTestingActive,
      nextLogInSeconds: Math.floor(nextLogIn / 1000),
      logFrequencyMinutes: this.logFrequencyMs / (60 * 1000),
      currentConfig: this.currentConfig ? {
        accountId: this.currentConfig.accountId,
        environment: this.currentConfig.environment,
        hasApiKey: !!this.currentConfig.apiKey
      } : null
    };

    console.log('🔍 AutoStrategyTester Status:', status);
    return status;
  }

  // Update forward testing status
  setForwardTestingStatus(isActive: boolean) {
    this.isForwardTestingActive = isActive;
    console.log(`🔄 Forward testing status updated: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
    
    if (isActive && !this.isRunning) {
      console.log('🎯 Forward testing activated - console logs will start appearing every 5 minutes');
    }
  }

  // Auto-start the tester when conditions are met
  autoStart(config: OANDAConfig, strategy: StrategySettings, isForwardTestingActive: boolean) {
    this.setForwardTestingStatus(isForwardTestingActive);
    
    if (!this.isRunning && config && strategy && isForwardTestingActive) {
      console.log('🎯 Auto-starting AutoStrategyTester - forward testing is active');
      console.log('📝 Console logs will appear every 5 minutes starting in 30 seconds');
      this.startAutoTesting(config, strategy, 300); // Test every 5 minutes
    } else if (this.isRunning && !isForwardTestingActive) {
      console.log('⏸️ Auto-stopping AutoStrategyTester - forward testing is inactive');
      this.stopAutoTesting();
    }
  }

  // Update log frequency
  setLogFrequency(minutes: number) {
    this.logFrequencyMs = minutes * 60 * 1000;
    console.log(`🕒 Log frequency updated to ${minutes} minutes`);
  }
}

// Export types for backward compatibility
export type { AutoTestResult };

// Export convenience function for global access
export const runStrategyLogger = () => {
  const tester = AutoStrategyTester.getInstance();
  return tester.manualConsoleTest();
};

// Ensure global bindings are set up when module loads
if (typeof window !== 'undefined') {
  // Initialize the singleton and bind to window
  const tester = AutoStrategyTester.getInstance();
  
  console.log('🧪 AutoStrategyTester global bindings initialized');
}
