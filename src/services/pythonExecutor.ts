
import type { StrategyResult, MarketData } from './python/types';
import { PyodideLoader } from './python/pyodideLoader';
import type { PyodideInstance } from './python/types';

export class PythonExecutor {
  static async initializePyodide(): Promise<PyodideInstance> {
    return PyodideLoader.initialize();
  }

  static async executeStrategy(code: string, marketData: MarketData): Promise<StrategyResult> {
    try {
      console.log('🐍 Starting Python strategy execution...');
      const pyodide = await this.initializePyodide();
      
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
      
      // Set the data and code in Python using proper conversion
      pyodide.globals.set('js_market_data', plainMarketData);
      pyodide.globals.set('js_strategy_code', code);
      
      console.log('🚀 Executing Python strategy...');
      
      // Execute the strategy with enhanced error handling and result validation
      const pythonResult = pyodide.runPython(`
try:
    # Convert JS data to Python and execute strategy
    print("🔍 Python: Starting strategy execution...")
    result = execute_strategy(js_market_data, js_strategy_code)
    print(f"✅ Python: Strategy execution completed successfully")
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
      
      // Validate Python result before converting
      if (pythonResult === undefined || pythonResult === null) {
        console.error('❌ Python execution returned undefined/null');
        return {
          entry: new Array(marketData.close.length).fill(false),
          exit: new Array(marketData.close.length).fill(false),
          direction: new Array(marketData.close.length).fill(null),
          error: 'Python execution returned undefined result'
        };
      }

      // Check if result has toJs method
      if (typeof pythonResult.toJs !== 'function') {
        console.error('❌ Python result does not have toJs method:', typeof pythonResult);
        return {
          entry: new Array(marketData.close.length).fill(false),
          exit: new Array(marketData.close.length).fill(false),
          direction: new Array(marketData.close.length).fill(null),
          error: 'Python result cannot be converted to JavaScript'
        };
      }
      
      // Convert Python result to JavaScript with error handling
      let jsResult;
      try {
        jsResult = pythonResult.toJs({ dict_converter: Object.fromEntries });
      } catch (conversionError) {
        console.error('❌ Error converting Python result to JavaScript:', conversionError);
        return {
          entry: new Array(marketData.close.length).fill(false),
          exit: new Array(marketData.close.length).fill(false),
          direction: new Array(marketData.close.length).fill(null),
          error: `Result conversion failed: ${conversionError instanceof Error ? conversionError.message : 'Unknown conversion error'}`
        };
      }

      // Validate the converted result
      if (!jsResult || typeof jsResult !== 'object') {
        console.error('❌ Converted result is not a valid object:', jsResult);
        return {
          entry: new Array(marketData.close.length).fill(false),
          exit: new Array(marketData.close.length).fill(false),
          direction: new Array(marketData.close.length).fill(null),
          error: 'Converted result is not a valid object'
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
      console.error('❌ Error executing Python strategy:', error);
      
      // Return fallback result with detailed error
      return {
        entry: new Array(marketData.close.length).fill(false),
        exit: new Array(marketData.close.length).fill(false),
        direction: new Array(marketData.close.length).fill(null),
        error: `Python execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
