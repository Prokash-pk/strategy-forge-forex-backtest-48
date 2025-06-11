
import { OptimizedExecutionManager } from './python/optimizedExecutionManager';
import { TradeExecutionDebugger } from './trading/tradeExecutionDebugger';

export class PythonExecutor {
  static async isAvailable(): Promise<boolean> {
    try {
      console.log('🔍 Checking Python availability...');
      const manager = OptimizedExecutionManager.getInstance();
      await manager.initializePyodide();
      console.log('✅ Python environment available');
      return true;
    } catch (error) {
      console.warn('⚠️ Python not available:', error);
      return false;
    }
  }

  static async executeStrategy(strategyCode: string, marketData: any): Promise<any> {
    try {
      console.log('🧠 Executing strategy logic...');
      console.log('🐍 Starting Python strategy execution...');
      
      // Enhanced debugging using static method
      TradeExecutionDebugger.logExecutionStep('PYTHON_EXECUTOR_START', {
        hasStrategyCode: !!strategyCode,
        strategyCodeLength: strategyCode?.length || 0,
        marketDataKeys: marketData ? Object.keys(marketData) : [],
        dataPoints: marketData?.close?.length || 0
      });

      const manager = OptimizedExecutionManager.getInstance();
      const result = await manager.executePythonStrategy(strategyCode, marketData);
      
      // ENHANCED FIX: Handle null/undefined results with better validation
      if (result === null || result === undefined) {
        console.warn('🔍 Python execution returned null/undefined result');
        TradeExecutionDebugger.logExecutionStep('PYTHON_EXECUTOR_NULL_RESULT', {
          strategyCodeLength: strategyCode?.length || 0,
          dataPoints: marketData?.close?.length || 0,
          resultType: typeof result,
          resultValue: result
        });
        
        return {
          entry: Array(marketData?.close?.length || 100).fill(false),
          exit: Array(marketData?.close?.length || 100).fill(false),
          direction: Array(marketData?.close?.length || 100).fill(null),
          error: 'Python execution returned null/undefined result'
        };
      }
      
      // Validate result structure
      if (typeof result !== 'object') {
        console.warn('🔍 Python execution returned non-object result:', typeof result);
        const dataLength = marketData?.close?.length || 100;
        return {
          entry: Array(dataLength).fill(false),
          exit: Array(dataLength).fill(false),
          direction: Array(dataLength).fill(null),
          error: `Python execution returned ${typeof result} instead of object`
        };
      }
      
      // Enhanced result validation and debugging
      const entryCount = Array.isArray(result.entry) ? result.entry.filter(Boolean).length : 0;
      const hasError = !!result.error;
      
      TradeExecutionDebugger.logExecutionStep('PYTHON_EXECUTOR_SUCCESS', {
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : [],
        entrySignalsCount: entryCount,
        error: result?.error || undefined,
        resultType: typeof result
      });

      console.log('✅ Python strategy execution completed');
      return result;
      
    } catch (error) {
      console.error('❌ Python strategy execution failed:', error);
      
      // Enhanced error logging using static method
      TradeExecutionDebugger.logExecutionStep('PYTHON_EXECUTOR_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown execution error',
        strategyCodeLength: strategyCode?.length || 0,
        dataPoints: marketData?.close?.length || 0,
        errorType: error?.constructor?.name || 'Unknown'
      });
      
      // Return safe fallback instead of throwing
      const dataLength = marketData?.close?.length || 100;
      return {
        entry: Array(dataLength).fill(false),
        exit: Array(dataLength).fill(false),
        direction: Array(dataLength).fill(null),
        error: error instanceof Error ? error.message : 'Unknown execution error'
      };
    }
  }
}
