
import { OANDAConfig, StrategySettings } from '@/types/oanda';
import { AutoTestResult } from './types';
import { AutoTesterCore } from './core/AutoTesterCore';
import { AutoStartManager } from './core/AutoStartManager';
import { StatusManager } from './core/StatusManager';
import { WindowBindingManager } from './core/WindowBindingManager';

export class OptimizedAutoStrategyTester {
  private static instance: OptimizedAutoStrategyTester;
  private testerCore: AutoTesterCore;
  private autoStartManager: AutoStartManager;
  private statusManager: StatusManager;
  private windowBindingManager: WindowBindingManager;

  private constructor() {
    this.testerCore = new AutoTesterCore();
    this.autoStartManager = new AutoStartManager(this.testerCore);
    this.statusManager = new StatusManager(this.testerCore, this.autoStartManager);
    this.windowBindingManager = new WindowBindingManager(this.testerCore, this.statusManager);
    this.windowBindingManager.bindToWindow();
  }

  static getInstance(): OptimizedAutoStrategyTester {
    if (!OptimizedAutoStrategyTester.instance) {
      OptimizedAutoStrategyTester.instance = new OptimizedAutoStrategyTester();
    }
    return OptimizedAutoStrategyTester.instance;
  }

  async startAutoTesting(
    config: OANDAConfig,
    strategy: StrategySettings,
    intervalSeconds: number = 900
  ) {
    return this.testerCore.startAutoTesting(config, strategy, intervalSeconds);
  }

  stopAutoTesting() {
    this.testerCore.stopAutoTesting();
    this.windowBindingManager.bindToWindow();
  }

  async runSingleTest(config: OANDAConfig, strategy: StrategySettings): Promise<AutoTestResult> {
    return this.testerCore.runSingleTest(config, strategy);
  }

  isActive(): boolean {
    return this.testerCore.isActive();
  }

  setTestFrequency(minutes: number) {
    this.testerCore.setTestFrequency(minutes);
  }

  getStatus() {
    return this.statusManager.getStatus();
  }

  setForwardTestingStatus(isActive: boolean) {
    this.autoStartManager.setForwardTestingStatus(isActive);
  }

  autoStart(config: OANDAConfig, strategy: StrategySettings, isForwardTestingActive: boolean) {
    this.autoStartManager.autoStart(config, strategy, isForwardTestingActive);
  }
}
