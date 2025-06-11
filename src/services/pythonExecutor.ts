
import { ExecutionManager } from './python/executionManager';

export class PythonExecutor {
  static async executeStrategy(strategyCode: string, marketData: any): Promise<any> {
    try {
      console.log('🧠 Executing strategy logic...');
      console.log('🐍 Starting Python strategy execution...');
      
      console.log('📊 Market data input:', {
        hasOpen: !!marketData.open,
        hasHigh: !!marketData.high,
        hasLow: !!marketData.low,
        hasClose: !!marketData.close,
        hasVolume: !!marketData.volume,
        closeLength: marketData.close?.length || 0
      });

      const executionManager = ExecutionManager.getInstance();
      const result = await executionManager.executePythonStrategy(strategyCode, marketData);
      
      console.log('✅ Python strategy execution completed');
      return result;
      
    } catch (error) {
      console.error('❌ Strategy execution failed:', error);
      throw error;
    }
  }
}
