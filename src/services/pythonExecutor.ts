import type { StrategyResult, MarketData } from './python/types';
import { PyodideLoader } from './python/pyodideLoader';
import type { PyodideInstance } from './python/types';
import { ExecutionManager } from './python/executionManager';
import { ResultProcessor } from './python/resultProcessor';
import { DataConverter } from './python/dataConverter';

export class PythonExecutor {
  static async initializePyodide(): Promise<PyodideInstance> {
    console.log('🔧 Initializing Pyodide...');
    const pyodide = await PyodideLoader.initialize();
    console.log('✅ Pyodide initialized successfully');
    return pyodide;
  }

  static async executeStrategy(code: string, marketData: MarketData): Promise<StrategyResult> {
    try {
      console.log('🐍 Starting Python strategy execution...');
      console.log('📊 Market data input:', {
        hasOpen: !!marketData.open,
        hasHigh: !!marketData.high, 
        hasLow: !!marketData.low,
        hasClose: !!marketData.close,
        hasVolume: !!marketData.volume,
        closeLength: marketData.close?.length || 0
      });

      // Validate market data first
      const validation = DataConverter.validateMarketData(marketData);
      if (!validation.isValid) {
        console.error('❌ Invalid market data provided');
        return ResultProcessor.createFallbackResult(marketData, validation.error!);
      }

      // Initialize Pyodide
      let pyodide: PyodideInstance;
      try {
        pyodide = await this.initializePyodide();
        if (!pyodide) {
          throw new Error('Pyodide initialization returned null/undefined');
        }
        console.log('✅ Pyodide instance ready');
      } catch (initError) {
        console.error('❌ Failed to initialize Pyodide:', initError);
        return ResultProcessor.createFallbackResult(
          marketData, 
          `Pyodide initialization failed: ${initError instanceof Error ? initError.message : 'Unknown error'}`
        );
      }
      
      // Execute strategy
      let pythonResult;
      try {
        pythonResult = await ExecutionManager.executePythonStrategy(pyodide, marketData, code);
      } catch (executionError) {
        console.error('❌ Strategy execution failed:', executionError);
        return ResultProcessor.createFallbackResult(
          marketData,
          `Strategy execution failed: ${executionError instanceof Error ? executionError.message : 'Unknown execution error'}`
        );
      }
      
      // Process and validate result
      const processedResult = ResultProcessor.processResult(pythonResult, marketData);
      const resultValidation = ResultProcessor.validateResult(processedResult, marketData);
      
      if (!resultValidation.isValid) {
        console.error('❌ Result validation failed:', resultValidation.error);
        return ResultProcessor.createFallbackResult(marketData, resultValidation.error!);
      }
      
      console.log('✅ Python strategy executed successfully');
      console.log('📊 Final result:', {
        hasEntry: !!processedResult.entry,
        hasExit: !!processedResult.exit,
        hasDirection: !!processedResult.direction,
        hasError: !!processedResult.error,
        keys: Object.keys(processedResult)
      });
      
      return processedResult;
      
    } catch (error) {
      console.error('❌ Critical error in Python strategy execution:', error);
      console.error('📊 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      return ResultProcessor.createFallbackResult(
        marketData,
        `Critical execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  static async isAvailable(): Promise<boolean> {
    try {
      console.log('🔍 Checking Python environment availability...');
      const result = await PyodideLoader.isAvailable();
      console.log(`📊 Python availability result: ${result}`);
      
      if (!result) {
        const lastError = PyodideLoader.getLastError();
        if (lastError) {
          console.error('🐍 Last Python error:', lastError.message);
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Python availability check failed:', error);
      return false;
    }
  }

  static getLastError(): Error | null {
    return PyodideLoader.getLastError();
  }

  static resetPythonEnvironment(): void {
    console.log('🔄 Resetting Python environment...');
    PyodideLoader.reset();
  }
}

// Re-export types for backward compatibility
export type { StrategyResult, MarketData };
