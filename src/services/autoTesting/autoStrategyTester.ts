
import { OANDAConfig, StrategySettings } from '@/types/oanda';
import { StrategyTestRunner } from './testRunner';
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

  static getInstance(): AutoStrategyTester {
    if (!AutoStrategyTester.instance) {
      AutoStrategyTester.instance = new AutoStrategyTester();
    }
    return AutoStrategyTester.instance;
  }

  async startAutoTesting(
    config: OANDAConfig,
    strategy: StrategySettings,
    intervalSeconds: number = 30
  ) {
    if (this.isRunning) {
      console.log('🔄 Auto-testing already running');
      return;
    }

    this.isRunning = true;
    this.currentConfig = config;
    this.currentStrategy = strategy;
    
    // Configure console logger
    ConsoleLogger.setConfiguration(config, strategy);
    
    TestLogger.logTestStart(strategy.strategy_name, strategy.symbol, intervalSeconds);

    console.log('🚀 AutoStrategyTester started');
    console.log('📊 Strategy:', strategy.strategy_name);
    console.log('📈 Symbol:', strategy.symbol);
    console.log('⏰ Test Interval:', intervalSeconds, 'seconds');
    console.log('📝 Console logging enabled - detailed evaluations every minute');

    // Initial test
    await StrategyTestRunner.runSingleTest(config, strategy);

    // Set up periodic testing
    this.testInterval = setInterval(async () => {
      if (this.isRunning && this.currentConfig && this.currentStrategy) {
        await StrategyTestRunner.runSingleTest(this.currentConfig, this.currentStrategy);
      }
    }, intervalSeconds * 1000);

    // Start the console logging cycle (every 1 minute)
    this.startConsoleLogging();

    // Bind to window for manual testing
    if (typeof window !== 'undefined') {
      (window as any).runStrategyLogger = () => this.manualConsoleTest();
      (window as any).autoStrategyTester = this;
      console.log('🧪 Manual test available: runStrategyLogger()');
    }
  }

  private startConsoleLogging() {
    if (this.loggingInterval) {
      clearInterval(this.loggingInterval);
    }

    console.log('📝 Starting enhanced console logging - updates every minute');
    console.log('🕒 Next log will appear in 10 seconds...');

    // Start logging after a short delay to give time for setup
    setTimeout(() => {
      if (this.isRunning && this.currentConfig && this.currentStrategy) {
        ConsoleLogger.runConsoleLogCycle();
      }
    }, 10000); // 10 seconds initial delay

    // Set up periodic console logging every 1 minute
    this.loggingInterval = setInterval(async () => {
      if (this.isRunning && this.currentConfig && this.currentStrategy) {
        console.log('🔄 Running scheduled console log cycle...');
        await ConsoleLogger.runConsoleLogCycle();
      }
    }, 60 * 1000); // Every 60 seconds
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
    
    // Clear console logger configuration
    ConsoleLogger.clearConfiguration();
    
    TestLogger.logTestStop();
    console.log('🛑 AutoStrategyTester stopped');
    console.log('🛑 Console logging stopped');

    // Clean up window bindings
    if (typeof window !== 'undefined') {
      delete (window as any).runStrategyLogger;
      delete (window as any).autoStrategyTester;
    }
  }

  async runSingleTest(config: OANDAConfig, strategy: StrategySettings): Promise<AutoTestResult> {
    return StrategyTestRunner.runSingleTest(config, strategy);
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: !!this.testInterval,
      hasLoggingInterval: !!this.loggingInterval,
      currentStrategy: this.currentStrategy?.strategy_name || null,
      currentSymbol: this.currentStrategy?.symbol || null,
      isForwardTestingActive: this.isForwardTestingActive,
      nextLogIn: this.loggingInterval ? '< 60 seconds' : 'Not scheduled'
    };
  }

  // Update forward testing status
  setForwardTestingStatus(isActive: boolean) {
    this.isForwardTestingActive = isActive;
    console.log(`🔄 Forward testing status updated: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
    
    if (isActive && !this.isRunning) {
      console.log('🎯 Forward testing activated - console logs will start appearing');
    }
  }

  // Auto-start the tester when conditions are met
  autoStart(config: OANDAConfig, strategy: StrategySettings, isForwardTestingActive: boolean) {
    this.setForwardTestingStatus(isForwardTestingActive);
    
    if (!this.isRunning && config && strategy && isForwardTestingActive) {
      console.log('🎯 Auto-starting AutoStrategyTester - forward testing is active');
      console.log('📝 Console logs will appear every minute starting in 10 seconds');
      this.startAutoTesting(config, strategy, 60); // Test every minute when forward testing is active
    } else if (this.isRunning && !isForwardTestingActive) {
      console.log('⏸️ Auto-stopping AutoStrategyTester - forward testing is inactive');
      this.stopAutoTesting();
    }
  }
}

// Export types for backward compatibility
export type { AutoTestResult };

// Export convenience function for global access
export const runStrategyLogger = () => {
  const tester = AutoStrategyTester.getInstance();
  return tester.manualConsoleTest();
};

// Global binding for manual testing
if (typeof window !== 'undefined') {
  (window as any).testStrategyLogger = runStrategyLogger;
  console.log('🧪 Global test function available: testStrategyLogger()');
}
