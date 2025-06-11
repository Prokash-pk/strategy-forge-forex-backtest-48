
import { OptimizedStrategyTestRunner } from '../optimizedTestRunner';
import { AutoTesterCore } from './AutoTesterCore';
import { StatusManager } from './StatusManager';

export class WindowBindingManager {
  constructor(
    private testerCore: AutoTesterCore,
    private statusManager: StatusManager
  ) {}

  bindToWindow() {
    if (typeof window !== 'undefined') {
      (window as any).optimizedAutoTester = {
        getStatus: () => this.statusManager.getStatus(),
        setTestFrequency: (minutes: number) => this.testerCore.setTestFrequency(minutes),
        isActive: () => this.testerCore.isActive(),
        stop: () => this.testerCore.stopAutoTesting()
      };
      
      (window as any).clearMarketDataCache = () => OptimizedStrategyTestRunner.clearCache();
      (window as any).getCacheStats = () => OptimizedStrategyTestRunner.getCacheStats();
      (window as any).setTestFrequency = (minutes: number) => this.testerCore.setTestFrequency(minutes);
      
      console.log('🧪 Optimized Debug functions available:');
      console.log('   - optimizedAutoTester.getStatus()');
      console.log('   - clearMarketDataCache()');
      console.log('   - getCacheStats()');
      console.log('   - setTestFrequency(minutes)');
    }
  }
}
