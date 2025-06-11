
import { TradeExecutionDebugger } from '../trading/tradeExecutionDebugger';

export class StrategyExecutorOptimized {
  static async executeStrategy(pyodide: any, strategyCode: string, marketData: any): Promise<any> {
    try {
      console.log('📊 Setting market data...');
      
      // Enhanced debugging - log market data details
      const dataPoints = marketData.close?.length || 0;
      console.log(`📈 Market data: ${dataPoints} data points`);
      if (dataPoints > 0) {
        console.log(`📊 Latest close: ${marketData.close[dataPoints - 1]}`);
        console.log(`📊 Price range: ${Math.min(...marketData.close)} - ${Math.max(...marketData.close)}`);
      }
      
      // Set market data in Python environment
      pyodide.globals.set('open_prices', marketData.open || []);
      pyodide.globals.set('high_prices', marketData.high || []);
      pyodide.globals.set('low_prices', marketData.low || []);
      pyodide.globals.set('close_prices', marketData.close || []);
      pyodide.globals.set('volume_data', marketData.volume || []);

      // Set the strategy code
      pyodide.globals.set('strategy_code', strategyCode);
      
      // Execute data setup
      await StrategyExecutorOptimized.setupMarketData(pyodide);
      
      // Execute the strategy
      await StrategyExecutorOptimized.executeStrategyCode(pyodide);

      // Get the result from Python globals
      const pythonResult = pyodide.globals.get('final_result');
      
      return StrategyExecutorOptimized.processResult(pythonResult, marketData);

    } catch (error) {
      console.error('❌ Python execution failed:', error);
      
      TradeExecutionDebugger.logExecutionStep('PYTHON_EXECUTION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown execution error',
        dataPoints: marketData?.close?.length || 0
      });
      
      // Return a safe fallback result
      const dataLength = marketData?.close?.length || 100;
      return {
        entry: Array(dataLength).fill(false),
        exit: Array(dataLength).fill(false),
        direction: Array(dataLength).fill(null),
        error: error instanceof Error ? error.message : 'Unknown execution error'
      };
    }
  }

  private static async setupMarketData(pyodide: any): Promise<void> {
    await pyodide.runPython(`
# Verify numpy is available before proceeding
try:
    import numpy as np
    print("✅ Numpy verification passed")
except ImportError as e:
    print(f"❌ Numpy import failed: {e}")
    raise ImportError("Numpy not available - package loading failed")

# Convert data to numpy arrays
open_data = np.array(open_prices) if open_prices else np.array([])
high_data = np.array(high_prices) if high_prices else np.array([])
low_data = np.array(low_prices) if low_prices else np.array([])
close_data = np.array(close_prices) if close_prices else np.array([])
volume_data_array = np.array(volume_data) if volume_data else np.array([])

print(f"📊 Data loaded: {len(close_data)} data points")
if len(close_data) > 0:
    print(f"📈 Latest close price: {close_data[-1]}")

# Create data dictionary (both lowercase and uppercase for compatibility)
# CRITICAL: Convert to lists to avoid .tolist() errors in strategy code
data = {
    'open': open_data.tolist(),
    'high': high_data.tolist(),
    'low': low_data.tolist(),
    'close': close_data.tolist(),
    'volume': volume_data_array.tolist(),
    'Open': open_data.tolist(),
    'High': high_data.tolist(),
    'Low': low_data.tolist(),
    'Close': close_data.tolist(),
    'Volume': volume_data_array.tolist()
}
`);
  }

  private static async executeStrategyCode(pyodide: any): Promise<void> {
    await pyodide.runPython(`
try:
    strategy_result = execute_strategy(data)
    print(f"✅ Strategy execution result type: {type(strategy_result)}")
    if hasattr(strategy_result, 'keys'):
        print(f"📊 Result keys: {list(strategy_result.keys())}")
    
    # Enhanced debugging for entry signals
    if 'entry' in strategy_result:
        entry_signals = strategy_result['entry']
        entry_count = sum(1 for signal in entry_signals if signal) if entry_signals else 0
        print(f"🎯 Entry signals found: {entry_count}")
        
        if entry_count > 0:
            # Find last entry signal
            for i in range(len(entry_signals) - 1, -1, -1):
                if entry_signals[i]:
                    print(f"📍 Last entry signal at index {i}")
                    if 'direction' in strategy_result and i < len(strategy_result['direction']):
                        print(f"📊 Signal direction: {strategy_result['direction'][i]}")
                    break
    
    # Store result in global variable for retrieval
    globals()['final_result'] = strategy_result
    print("📊 Result stored in globals as 'final_result'")
    
except Exception as e:
    print(f"❌ Final execution error: {e}")
    import traceback
    traceback.print_exc()
    globals()['final_result'] = {
        'entry': [False] * len(data['close']) if len(data['close']) > 0 else [False] * 100,
        'exit': [False] * len(data['close']) if len(data['close']) > 0 else [False] * 100,
        'direction': [None] * len(data['close']) if len(data['close']) > 0 else [None] * 100,
        'error': str(e)
    }
`);
  }

  private static processResult(pythonResult: any, marketData: any): any {
    console.log('🔍 Retrieved Python result:', {
      resultExists: !!pythonResult,
      resultType: typeof pythonResult,
      hasToJs: pythonResult && typeof pythonResult.toJs === 'function'
    });

    // Handle undefined result (execution failure)
    if (pythonResult === undefined || pythonResult === null) {
      console.error('❌ Python execution returned undefined/null result');
      const dataLength = marketData?.close?.length || 100;
      return {
        entry: Array(dataLength).fill(false),
        exit: Array(dataLength).fill(false),
        direction: Array(dataLength).fill(null),
        error: 'Python execution failed - no result returned'
      };
    }

    // Convert result to JavaScript with proper error handling
    let jsResult;
    try {
      if (pythonResult.toJs) {
        jsResult = pythonResult.toJs({ dict_converter: Object.fromEntries });
      } else {
        jsResult = pythonResult;
      }
      console.log('✅ Successfully converted Python result to JavaScript');
    } catch (error) {
      console.error('❌ Error converting Python result to JavaScript:', error);
      const dataLength = marketData?.close?.length || 100;
      return {
        entry: Array(dataLength).fill(false),
        exit: Array(dataLength).fill(false),
        direction: Array(dataLength).fill(null),
        error: 'Failed to convert Python result to JavaScript'
      };
    }

    // Enhanced result analysis and debugging
    const entryCount = jsResult?.entry?.filter?.(Boolean)?.length || 0;
    const buySignals = jsResult?.direction?.filter?.(d => d === 'BUY')?.length || 0;
    const sellSignals = jsResult?.direction?.filter?.(d => d === 'SELL')?.length || 0;
    
    console.log('🎯 Strategy execution completed:', {
      dataPoints: marketData?.close?.length || 0,
      hasEntry: jsResult?.entry?.length > 0,
      entrySignals: entryCount,
      buySignals,
      sellSignals,
      hasDirection: !!jsResult?.direction,
      error: jsResult?.error,
      resultKeys: Object.keys(jsResult || {})
    });

    // Log to trade debugger with enhanced details
    TradeExecutionDebugger.logExecutionStep('PYTHON_EXECUTION_COMPLETE', {
      dataPoints: marketData?.close?.length || 0,
      entrySignalsCount: entryCount,
      buySignalsCount: buySignals,
      sellSignalsCount: sellSignals,
      resultKeys: Object.keys(jsResult || {}),
      hasResult: !!jsResult,
      lastEntrySignal: jsResult?.entry?.[jsResult.entry.length - 1] || false,
      lastDirection: jsResult?.direction?.[jsResult.direction.length - 1] || null,
      error: jsResult?.error || null
    });

    return jsResult;
  }
}
