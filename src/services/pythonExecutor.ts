
import type { StrategyResult, MarketData } from './python/types';
import { PyodideLoader } from './python/pyodideLoader';
import type { PyodideInstance } from './python/types';

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

      // Check if we have valid market data
      if (!marketData || !marketData.close || marketData.close.length === 0) {
        console.error('❌ Invalid market data provided');
        return {
          entry: [],
          exit: [],
          direction: [],
          error: 'Invalid market data: no close prices available'
        };
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
        return {
          entry: new Array(marketData.close.length).fill(false),
          exit: new Array(marketData.close.length).fill(false),
          direction: new Array(marketData.close.length).fill(null),
          error: `Pyodide initialization failed: ${initError instanceof Error ? initError.message : 'Unknown error'}`
        };
      }
      
      console.log('📊 Converting market data for Python execution...');
      
      // Convert market data to plain JavaScript object with proper data conversion
      const plainMarketData = {
        open: Array.from(marketData.open).map(x => Number(x)),
        high: Array.from(marketData.high).map(x => Number(x)),
        low: Array.from(marketData.low).map(x => Number(x)),
        close: Array.from(marketData.close).map(x => Number(x)),
        volume: Array.from(marketData.volume).map(x => Number(x))
      };
      
      console.log('📈 Market data converted:', {
        dataPoints: plainMarketData.close.length,
        sampleClose: plainMarketData.close.slice(0, 3),
        sampleHigh: plainMarketData.high.slice(0, 3)
      });
      
      // Validate the converted data
      if (plainMarketData.close.some(isNaN)) {
        console.error('❌ Invalid data detected: NaN values in close prices');
        return {
          entry: new Array(marketData.close.length).fill(false),
          exit: new Array(marketData.close.length).fill(false),
          direction: new Array(marketData.close.length).fill(null),
          error: 'Invalid market data: NaN values detected in close prices'
        };
      }

      // Set the data and code in Python using proper conversion
      try {
        console.log('📤 Setting data in Python environment...');
        pyodide.globals.set('js_market_data', plainMarketData);
        pyodide.globals.set('js_strategy_code', code);
        console.log('✅ Data set in Python environment');
      } catch (setError) {
        console.error('❌ Failed to set data in Python:', setError);
        return {
          entry: new Array(marketData.close.length).fill(false),
          exit: new Array(marketData.close.length).fill(false),
          direction: new Array(marketData.close.length).fill(null),
          error: `Failed to set data in Python: ${setError instanceof Error ? setError.message : 'Unknown error'}`
        };
      }
      
      console.log('🚀 Executing Python strategy...');
      
      // Robust Python execution with comprehensive error handling
      let pythonResult;
      try {
        console.log('🔄 Attempting Python execution...');
        
        // First, check if the execute_strategy function is available
        const checkResult = pyodide.runPython(`
try:
    # Check if execute_strategy function exists
    if 'execute_strategy' in globals():
        print("✅ execute_strategy function found")
        result = True
    else:
        print("❌ execute_strategy function not found")
        result = False
    result
except Exception as e:
    print(f"❌ Error checking execute_strategy: {e}")
    False
        `);
        
        if (!checkResult) {
          console.error('❌ execute_strategy function not available in Python environment');
          return {
            entry: new Array(marketData.close.length).fill(false),
            exit: new Array(marketData.close.length).fill(false),
            direction: new Array(marketData.close.length).fill(null),
            error: 'Python environment not properly initialized: execute_strategy function not found'
          };
        }
        
        pythonResult = pyodide.runPython(`
try:
    print("🔍 Python: Starting strategy execution...")
    result = execute_strategy(js_market_data, js_strategy_code)
    print(f"✅ Python: Strategy execution completed")
    print(f"📊 Python: Result type: {type(result)}")
    
    if result is None:
        print("⚠️ Python: Strategy returned None")
        result = {"error": "Strategy returned None", "entry": [], "exit": [], "direction": []}
    elif not isinstance(result, dict):
        print(f"⚠️ Python: Strategy returned non-dict: {type(result)}")
        result = {"error": f"Strategy returned {type(result)}, expected dict", "entry": [], "exit": [], "direction": []}
    else:
        print(f"📊 Python: Result keys: {list(result.keys())}")
        if 'entry' in result:
            entry_count = sum(1 for x in result['entry'] if x) if result['entry'] else 0
            print(f"📈 Python: Entry signals: {entry_count}")
        if 'direction' in result:
            buy_count = sum(1 for d in result['direction'] if d == 'BUY') if result['direction'] else 0
            sell_count = sum(1 for d in result['direction'] if d == 'SELL') if result['direction'] else 0
            print(f"📊 Python: BUY signals: {buy_count}, SELL signals: {sell_count}")
    
    result
except Exception as e:
    print(f"❌ Python: Strategy execution failed: {str(e)}")
    import traceback
    traceback.print_exc()
    {"error": str(e), "entry": [], "exit": [], "direction": []}
        `);
        
        console.log('✅ Python execution completed, result received');
        
      } catch (pythonError) {
        console.error('❌ Python runPython failed:', pythonError);
        return {
          entry: new Array(marketData.close.length).fill(false),
          exit: new Array(marketData.close.length).fill(false),
          direction: new Array(marketData.close.length).fill(null),
          error: `Python execution failed: ${pythonError instanceof Error ? pythonError.message : 'Unknown Python error'}`
        };
      }
      
      // Enhanced result validation with detailed logging
      console.log('🔍 Validating Python result...');
      console.log('📋 Raw Python result:', pythonResult);
      console.log('📋 Python result type:', typeof pythonResult);
      console.log('📋 Python result constructor:', pythonResult?.constructor?.name);
      
      if (pythonResult === undefined || pythonResult === null) {
        console.error('❌ Python execution returned undefined/null');
        return {
          entry: new Array(marketData.close.length).fill(false),
          exit: new Array(marketData.close.length).fill(false),
          direction: new Array(marketData.close.length).fill(null),
          error: 'Python execution returned undefined result'
        };
      }

      // Handle different result types safely
      let jsResult;
      
      // Case 1: Result already is a JavaScript object (plain object)
      if (pythonResult && typeof pythonResult === 'object' && pythonResult.constructor === Object) {
        console.log('✅ Result is already a plain JavaScript object');
        jsResult = pythonResult;
      }
      // Case 2: Result is a Pyodide proxy object with toJs method
      else if (pythonResult && typeof pythonResult === 'object' && typeof pythonResult.toJs === 'function') {
        console.log('🔄 Converting Pyodide proxy to JavaScript...');
        try {
          jsResult = pythonResult.toJs({ dict_converter: Object.fromEntries });
          console.log('✅ Conversion successful');
        } catch (conversionError) {
          console.error('❌ Error converting Python result to JavaScript:', conversionError);
          return {
            entry: new Array(marketData.close.length).fill(false),
            exit: new Array(marketData.close.length).fill(false),
            direction: new Array(marketData.close.length).fill(null),
            error: `Result conversion failed: ${conversionError instanceof Error ? conversionError.message : 'Unknown conversion error'}`
          };
        }
      }
      // Case 3: Result is some other type of object
      else if (pythonResult && typeof pythonResult === 'object') {
        console.log('🔄 Converting non-proxy object...');
        try {
          // Try to convert to plain object
          jsResult = JSON.parse(JSON.stringify(pythonResult));
          console.log('✅ Object conversion successful');
        } catch (conversionError) {
          console.error('❌ Failed to convert object result:', conversionError);
          return {
            entry: new Array(marketData.close.length).fill(false),
            exit: new Array(marketData.close.length).fill(false),
            direction: new Array(marketData.close.length).fill(null),
            error: `Object conversion failed: ${conversionError instanceof Error ? conversionError.message : 'Unknown conversion error'}`
          };
        }
      }
      // Case 4: Unexpected result type
      else {
        console.error('❌ Unexpected Python result type:', typeof pythonResult, pythonResult);
        return {
          entry: new Array(marketData.close.length).fill(false),
          exit: new Array(marketData.close.length).fill(false),
          direction: new Array(marketData.close.length).fill(null),
          error: `Unexpected Python result type: ${typeof pythonResult}`
        };
      }

      // Final validation of converted result
      if (!jsResult || typeof jsResult !== 'object') {
        console.error('❌ Final result validation failed:', jsResult);
        return {
          entry: new Array(marketData.close.length).fill(false),
          exit: new Array(marketData.close.length).fill(false),
          direction: new Array(marketData.close.length).fill(null),
          error: 'Invalid result format after conversion'
        };
      }
      
      console.log('✅ Python strategy executed successfully');
      console.log('📊 Final result:', {
        hasEntry: !!jsResult.entry,
        hasExit: !!jsResult.exit,
        hasDirection: !!jsResult.direction,
        hasError: !!jsResult.error,
        keys: Object.keys(jsResult)
      });
      
      return jsResult as StrategyResult;
      
    } catch (error) {
      console.error('❌ Critical error in Python strategy execution:', error);
      console.error('📊 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Return fallback result with detailed error
      return {
        entry: new Array(marketData?.close?.length || 0).fill(false),
        exit: new Array(marketData?.close?.length || 0).fill(false),
        direction: new Array(marketData?.close?.length || 0).fill(null),
        error: `Critical execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
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

  static resetPythonEnvironment(): void {
    console.log('🔄 Resetting Python environment...');
    PyodideLoader.reset();
  }
}

// Re-export types for backward compatibility
export type { StrategyResult, MarketData };
