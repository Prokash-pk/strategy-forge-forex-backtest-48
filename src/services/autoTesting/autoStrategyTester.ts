
import { OANDAConfig, StrategySettings } from '@/types/oanda';
import { StrategyTestRunner } from './testRunner';
import { TestLogger } from './testLogger';
import { AutoTestResult } from './types';

export class AutoStrategyTester {
  private static instance: AutoStrategyTester;
  private testInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

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
    
    TestLogger.logTestStart(strategy.strategy_name, strategy.symbol, intervalSeconds);

    // Initial test
    await StrategyTestRunner.runSingleTest(config, strategy);

    // Set up periodic testing
    this.testInterval = setInterval(async () => {
      if (this.isRunning) {
        await StrategyTestRunner.runSingleTest(config, strategy);
      }
    }, intervalSeconds * 1000);
  }

  stopAutoTesting() {
    if (this.testInterval) {
      clearInterval(this.testInterval);
      this.testInterval = null;
    }
    this.isRunning = false;
    
    TestLogger.logTestStop();
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
      hasInterval: !!this.testInterval
    };
  }
}

// Export types for backward compatibility
export type { AutoTestResult };
