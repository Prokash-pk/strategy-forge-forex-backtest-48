
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
      
      // Execute the strategy with enhanced error handling
      const result = pyodide.runPython(`
try:
    # Convert JS data to Python and execute strategy
    print("🔍 Python: Starting strategy execution...")
    result = execute_strategy(js_market_data, js_strategy_code)
    print(f"✅ Python: Strategy execution completed successfully")
    print(f"📊 Python: Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
    if isinstance(result, dict):
        if 'entry' in result:
            entry_count = sum(1 for x in result['entry'] if x) if result['entry'] else 0
            print(f"📈 Python: Entry signals: {entry_count}")
        if 'direction' in result:
            buy_count = sum(1 for d in result['direction'] if d == 'BUY') if result['direction'] else 0
            sell_count = sum(1 for d in result['direction'] if d == 'SELL') if result['direction'] else 0
            print(f"📊 Python: BUY signals: {buy_count}, SELL signals: {sell_count}")
        if 'trade_direction' in result:
            trade_buy_count = sum(1 for d in result['trade_direction'] if d == 'BUY') if result['trade_direction'] else 0
            trade_sell_count = sum(1 for d in result['trade_direction'] if d == 'SELL') if result['trade_direction'] else 0
            print(f"🔄 Python: Trade BUY signals: {trade_buy_count}, Trade SELL signals: {trade_sell_count}")
    result
except Exception as e:
    print(f"❌ Python: Strategy execution failed: {str(e)}")
    import traceback
    traceback.print_exc()
    {"error": str(e), "entry": [], "exit": [], "direction": [], "trade_direction": []}
      `);
      
      // Convert Python result to JavaScript
      const jsResult = result.toJs({ dict_converter: Object.fromEntries });
      
      console.log('✅ Python strategy executed successfully');
      console.log('📊 Final result:', {
        hasEntry: !!jsResult.entry,
        hasExit: !!jsResult.exit,
        hasDirection: !!jsResult.direction,
        hasTradeDirection: !!jsResult.trade_direction,
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
        trade_direction: new Array(marketData.close.length).fill(null),
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
