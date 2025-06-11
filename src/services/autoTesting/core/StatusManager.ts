
import { OptimizedStrategyTestRunner } from '../optimizedTestRunner';
import { AutoTesterCore } from './AutoTesterCore';
import { AutoStartManager } from './AutoStartManager';

export class StatusManager {
  constructor(
    private testerCore: AutoTesterCore,
    private autoStartManager: AutoStartManager
  ) {}

  getStatus() {
    const nextLogIn = this.testerCore.getLastLogTime() > 0 ? 
      Math.max(0, this.testerCore.getLogFrequencyMs() - (Date.now() - this.testerCore.getLastLogTime())) : 
      this.testerCore.getLogFrequencyMs();
    
    const cacheStats = OptimizedStrategyTestRunner.getCacheStats();
    const currentConfig = this.testerCore.getCurrentConfig();
    const currentStrategy = this.testerCore.getCurrentStrategy();
    
    const status = {
      isRunning: this.testerCore.isActive(),
      hasInterval: this.testerCore.hasTestInterval(),
      hasLoggingInterval: this.testerCore.hasLoggingInterval(),
      currentStrategy: currentStrategy?.strategy_name || null,
      currentSymbol: currentStrategy?.symbol || null,
      isForwardTestingActive: this.autoStartManager.getForwardTestingStatus(),
      nextLogInSeconds: Math.floor(nextLogIn / 1000),
      logFrequencyMinutes: this.testerCore.getLogFrequencyMs() / (60 * 1000),
      testFrequencyMinutes: this.testerCore.getTestFrequencyMs() / (60 * 1000),
      cacheStats,
      currentConfig: currentConfig ? {
        accountId: currentConfig.accountId,
        environment: currentConfig.environment,
        hasApiKey: !!currentConfig.apiKey
      } : null
    };

    console.log('🔍 OptimizedAutoStrategyTester Status:', status);
    return status;
  }
}
