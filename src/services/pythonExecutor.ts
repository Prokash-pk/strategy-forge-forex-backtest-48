
import { EnhancedExecutionManager } from './python/enhancedExecutionManager';
import { TradeExecutionDebugger } from './trading/tradeExecutionDebugger';

export class PythonExecutor {
  static async executeStrategy(strategyCode: string, marketData: any): Promise<any> {
    try {
      console.log('🧠 Executing strategy logic...');
      console.log('🐍 Starting Python strategy execution...');
      
      await TradeExecutionDebugger.logExecutionStep('PYTHON_EXECUTOR_START', {
        hasStrategyCode: !!strategyCode,
        strategyCodeLength: strategyCode?.length || 0,
        marketDataKeys: Object.keys(marketData || {}),
        dataPoints: marketData?.close?.length || 0
      });

      console.log('📊 Market data input:', {
        hasOpen: !!marketData.open,
        hasHigh: !!marketData.high,
        hasLow: !!marketData.low,
        hasClose: !!marketData.close,
        hasVolume: !!marketData.volume,
        closeLength: marketData.close?.length || 0
      });

      const executionManager = EnhancedExecutionManager.getInstance();
      const result = await executionManager.executePythonStrategy(strategyCode, marketData);
      
      await TradeExecutionDebugger.logExecutionStep('PYTHON_EXECUTOR_SUCCESS', {
        hasResult: !!result,
        resultKeys: Object.keys(result || {}),
        entrySignalsCount: result?.entry?.filter?.(Boolean)?.length || 0,
        error: result?.error
      });

      console.log('✅ Python strategy execution completed');
      return result;
      
    } catch (error) {
      console.error('❌ Strategy execution failed:', error);
      
      await TradeExecutionDebugger.logExecutionStep('PYTHON_EXECUTOR_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name
      });
      
      throw error;
    }
  }

  static async isAvailable(): Promise<boolean> {
    try {
      console.log('🔍 Checking Python availability...');
      const executionManager = EnhancedExecutionManager.getInstance();
      await executionManager.initializePyodide();
      
      console.log('✅ Python environment available');
      return true;
    } catch (error) {
      console.error('❌ Python environment not available:', error);
      return false;
    }
  }

  static resetPythonEnvironment(): void {
    try {
      console.log('🔄 Resetting Python environment...');
      // Reset all managers
      const executionManager = EnhancedExecutionManager.getInstance();
      executionManager['pyodide'] = null; // Reset the instance
      
      console.log('🔄 Python environment reset');
    } catch (error) {
      console.error('❌ Failed to reset Python environment:', error);
    }
  }
}
