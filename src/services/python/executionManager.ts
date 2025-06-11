
import { PyodideLoader } from './pyodideLoader';
import type { PyodideInstance } from './types';
import { DataConverter } from './dataConverter';
import { ResultProcessor } from './resultProcessor';

export class ExecutionManager {
  static async executePythonStrategy(pyodide: PyodideInstance, marketData: any, strategyCode: string): Promise<any> {
    try {
      console.log('🚀 Executing Python strategy...');
      
      // Convert and validate market data
      const plainMarketData = DataConverter.convertMarketData(marketData);
      const validation = DataConverter.validateMarketData(marketData);
      
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Set the data and code in Python using proper conversion
      console.log('📤 Setting data in Python environment...');
      pyodide.globals.set('js_market_data', plainMarketData);
      pyodide.globals.set('js_strategy_code', strategyCode);
      console.log('✅ Data set in Python environment');
      
      // Check if execute_strategy function is available and re-initialize if needed
      const checkResult = pyodide.runPython(`
try:
    if 'execute_strategy' in globals():
        print("✅ execute_strategy function found")
        result = True
    else:
        print("❌ execute_strategy function not found in globals")
        print(f"Available globals: {list(globals().keys())}")
        result = False
    result
except Exception as e:
    print(f"❌ Error checking execute_strategy: {e}")
    False
      `);
      
      if (!checkResult) {
        console.warn('🔄 execute_strategy function not found, reinitializing Python environment...');
        // Force reinitialize the Python environment
        PyodideLoader.reset();
        throw new Error('Python environment not properly initialized: execute_strategy function not found');
      }
      
      // Execute the strategy with comprehensive error handling
      const pythonResult = pyodide.runPython(`
try:
    print("🔍 Python: Starting strategy execution...")
    raw_result = execute_strategy(js_market_data, js_strategy_code)
    print(f"✅ Python: Strategy execution completed")
    print(f"📊 Python: Raw result type: {type(raw_result)}")
    
    # Ensure we always have a valid result
    if raw_result is None:
        print("⚠️ Python: Strategy returned None - creating default result")
        result = {
            "entry": [False] * len(js_market_data["close"]),
            "exit": [False] * len(js_market_data["close"]),
            "direction": [None] * len(js_market_data["close"]),
            "error": "Strategy returned None"
        }
    elif not isinstance(raw_result, dict):
        print(f"⚠️ Python: Strategy returned non-dict: {type(raw_result)} - creating default result")
        result = {
            "entry": [False] * len(js_market_data["close"]),
            "exit": [False] * len(js_market_data["close"]),
            "direction": [None] * len(js_market_data["close"]),
            "error": f"Strategy returned {type(raw_result)}, expected dict"
        }
    else:
        result = raw_result
        print(f"📊 Python: Valid result keys: {list(result.keys())}")
        if 'entry' in result and result['entry']:
            entry_count = sum(1 for x in result['entry'] if x) if result['entry'] else 0
            print(f"📈 Python: Entry signals: {entry_count}")
        if 'direction' in result and result['direction']:
            buy_count = sum(1 for d in result['direction'] if d == 'BUY') if result['direction'] else 0
            sell_count = sum(1 for d in result['direction'] if d == 'SELL') if result['direction'] else 0
            print(f"📊 Python: BUY signals: {buy_count}, SELL signals: {sell_count}")
    
    print(f"📊 Python: Final result type: {type(result)}")
    result
except Exception as e:
    print(f"❌ Python: Strategy execution failed: {str(e)}")
    import traceback
    traceback.print_exc()
    {
        "entry": [False] * len(js_market_data["close"]),
        "exit": [False] * len(js_market_data["close"]),
        "direction": [None] * len(js_market_data["close"]),
        "error": str(e)
    }
      `);
      
      console.log('✅ Python execution completed, result received');
      console.log('🔍 Raw Python result:', pythonResult);
      
      return pythonResult;
      
    } catch (error) {
      console.error('❌ Python execution failed:', error);
      throw error;
    }
  }
}
