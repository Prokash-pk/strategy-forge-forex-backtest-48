
import { OANDAConfig, StrategySettings } from '@/types/oanda';
import { AutoTesterCore } from './AutoTesterCore';

export class AutoStartManager {
  private isForwardTestingActive: boolean = false;

  constructor(private testerCore: AutoTesterCore) {}

  setForwardTestingStatus(isActive: boolean) {
    this.isForwardTestingActive = isActive;
    console.log(`🔄 Forward testing status updated: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
  }

  autoStart(config: OANDAConfig, strategy: StrategySettings, isForwardTestingActive: boolean) {
    this.setForwardTestingStatus(isForwardTestingActive);
    
    if (!this.testerCore.isActive() && config && strategy && isForwardTestingActive) {
      console.log('🎯 Auto-starting OptimizedAutoStrategyTester - reduced data usage mode');
      console.log('📝 Console logs every 15 minutes, market data cached for 5 minutes');
      this.testerCore.startAutoTesting(config, strategy, 900); // 15 minutes
    } else if (this.testerCore.isActive() && !isForwardTestingActive) {
      console.log('⏸️ Auto-stopping OptimizedAutoStrategyTester');
      this.testerCore.stopAutoTesting();
    }
  }

  getForwardTestingStatus(): boolean {
    return this.isForwardTestingActive;
  }
}
