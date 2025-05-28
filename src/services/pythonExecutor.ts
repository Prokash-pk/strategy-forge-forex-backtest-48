
import type { StrategyResult, MarketData } from './python/types';
import { PyodideLoader } from './python/pyodideLoader';

export class PythonExecutor {
  static async initializePyodide(): Promise<any> {
    return PyodideLoader.initialize();
  }

  static async executeStrategy(code: string, marketData: MarketData): Promise<StrategyResult> {
    try {
      const pyodide = await this.initializePyodide();
      
      console.log('Executing Python strategy code...');
      
      // Convert market data to plain JavaScript object with proper data conversion
      const plainMarketData = {
        open: Array.from(marketData.open).map(x => Number(x)),
        high: Array.from(marketData.high).map(x => Number(x)),
        low: Array.from(marketData.low).map(x => Number(x)),
        close: Array.from(marketData.close).map(x => Number(x)),
        volume: Array.from(marketData.volume).map(x => Number(x))
      };
      
      // Set the data and code in Python using proper conversion
      pyodide.globals.set('js_market_data', plainMarketData);
      pyodide.globals.set('js_strategy_code', code);
      
      // Execute the strategy with proper data conversion
      const result = pyodide.runPython(`
# Convert JS data to Python and execute strategy
result = execute_strategy(js_market_data, js_strategy_code)
result
      `);
      
      // Convert Python result to JavaScript
      const jsResult = result.toJs({ dict_converter: Object.fromEntries });
      
      console.log('Python strategy executed successfully');
      return jsResult as StrategyResult;
      
    } catch (error) {
      console.error('Error executing Python strategy:', error);
      
      // Return fallback result
      return {
        entry: new Array(marketData.close.length).fill(false),
        exit: new Array(marketData.close.length).fill(false),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async isAvailable(): Promise<boolean> {
    return PyodideLoader.isAvailable();
  }
}

// Re-export types for backward compatibility
export type { StrategyResult, MarketData };
