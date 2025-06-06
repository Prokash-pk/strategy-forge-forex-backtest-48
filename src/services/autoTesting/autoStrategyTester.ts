
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
    console.log('⏰ Interval:', intervalSeconds, 'seconds');
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
  }

  private startConsoleLogging() {
    if (this.loggingInterval) {
      clearInterval(this.loggingInterval);
    }

    console.log('📝 Starting enhanced console logging - updates every minute');

    // Start immediate logging
    if (this.currentConfig && this.currentStrategy) {
      setTimeout(() => {
        ConsoleLogger.runConsoleLogCycle();
      }, 3000); // Give 3 seconds for initialization
    }

    // Set up periodic console logging every 1 minute
    this.loggingInterval = setInterval(async () => {
      if (this.isRunning && this.currentConfig && this.currentStrategy) {
        await ConsoleLogger.runConsoleLogCycle();
      }
    }, 60 * 1000); // Every 60 seconds
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
      isForwardTestingActive: this.isForwardTestingActive
    };
  }

  // Update forward testing status
  setForwardTestingStatus(isActive: boolean) {
    this.isForwardTestingActive = isActive;
    console.log(`🔄 Forward testing status updated: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
  }

  // Auto-start the tester when conditions are met
  autoStart(config: OANDAConfig, strategy: StrategySettings, isForwardTestingActive: boolean) {
    this.setForwardTestingStatus(isForwardTestingActive);
    
    if (!this.isRunning && config && strategy && isForwardTestingActive) {
      console.log('🎯 Auto-starting AutoStrategyTester - forward testing is active');
      this.startAutoTesting(config, strategy, 60); // Test every minute when forward testing is active
    } else if (this.isRunning && !isForwardTestingActive) {
      console.log('⏸️ Auto-stopping AutoStrategyTester - forward testing is inactive');
      this.stopAutoTesting();
    }
  }
}

// Export types for backward compatibility
export type { AutoTestResult };
