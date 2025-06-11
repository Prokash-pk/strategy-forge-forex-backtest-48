
import { PyodideManager } from './pyodideManager';
import { TradeExecutionDebugger } from '../trading/tradeExecutionDebugger';

export class EnhancedExecutionManager {
  private static instance: EnhancedExecutionManager;
  private pyodide: any = null;
  private isInitialized = false;

  static getInstance(): EnhancedExecutionManager {
    if (!EnhancedExecutionManager.instance) {
      EnhancedExecutionManager.instance = new EnhancedExecutionManager();
    }
    return EnhancedExecutionManager.instance;
  }

  async initializePyodide(): Promise<void> {
    if (this.pyodide && this.isInitialized) {
      console.log('🐍 Pyodide already initialized');
      return;
    }

    await TradeExecutionDebugger.logExecutionStep('PYODIDE_INIT_START', {
      timestamp: new Date().toISOString()
    });
    
    this.pyodide = await PyodideManager.getInstance().getPyodide();
    
    // Set up the Python environment with strategy execution functions
    console.log('🐍 Setting up Python strategy execution environment...');
    
    const pythonSetup = `
import numpy as np
import pandas as pd
import math
from typing import Dict, List, Any, Optional, Union

print("🐍 Python environment initialized successfully")

def execute_strategy(data):
    """Main strategy execution function with enhanced error handling"""
    try:
        print("🚀 Executing strategy...")
        print(f"📊 Data type: {type(data)}")
        print(f"📊 Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        
        # Execute the user's strategy code
        local_vars = {'data': data}
        exec(strategy_code, globals(), local_vars)
        
        print(f"✅ Strategy executed, local vars: {list(local_vars.keys())}")
        
        # Return the result from local variables
        if 'result' in local_vars:
            result = local_vars['result']
            print(f"📊 Found result variable with keys: {list(result.keys()) if isinstance(result, dict) else type(result)}")
            return result
        else:
            # If no result variable, try to construct one from common variables
            entry = local_vars.get('entry', [])
            exit = local_vars.get('exit', [])
            direction = local_vars.get('direction', local_vars.get('trade_direction', []))
            
            print(f"🔍 Constructing result from variables:")
            print(f"   Entry signals: {len(entry) if hasattr(entry, '__len__') else 'Not a list'}")
            print(f"   Exit signals: {len(exit) if hasattr(exit, '__len__') else 'Not a list'}")
            print(f"   Directions: {len(direction) if hasattr(direction, '__len__') else 'Not a list'}")
            
            # Try to find any boolean arrays that might be signals
            if not entry and not exit and not direction:
                for key, value in local_vars.items():
                    if isinstance(value, (list, np.ndarray)) and len(value) > 0:
                        if key.lower() in ['buy_signals', 'sell_signals', 'signals', 'entries']:
                            entry = value
                            print(f"📊 Found signals in variable: {key}")
                            break
                
                # Generate basic signals if none found
                if not entry:
                    print("⚠️ No signals found, generating empty signals")
                    data_length = len(data.get('close', [])) if isinstance(data, dict) else 100
                    entry = [False] * data_length
                    exit = [False] * data_length
                    direction = [None] * data_length
            
            return {
                'entry': entry,
                'exit': exit if exit else [False] * len(entry),
                'direction': direction if direction else [None] * len(entry)
            }
    except Exception as e:
        print(f"❌ Strategy execution error: {e}")
        import traceback
        traceback.print_exc()
        return {
            'entry': [False] * len(data.get('close', [])) if isinstance(data, dict) else [False] * 100,
            'exit': [False] * len(data.get('close', [])) if isinstance(data, dict) else [False] * 100,
            'direction': [None] * len(data.get('close', [])) if isinstance(data, dict) else [None] * 100,
            'error': str(e)
        }

print("🎯 Strategy execution function defined successfully")
`;
    
    await this.pyodide.runPython(pythonSetup);
    
    // Test that the function was created
    const functionExists = await this.pyodide.runPython(`
'execute_strategy' in globals() and callable(execute_strategy)
`);
    
    if (!functionExists) {
      throw new Error('Failed to create execute_strategy function');
    }
    
    this.isInitialized = true;
    
    await TradeExecutionDebugger.logExecutionStep('PYODIDE_INIT_COMPLETE', {
      initialized: !!this.pyodide,
      functionExists,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Python environment fully initialized');
  }

  async executePythonStrategy(strategyCode: string, marketData: any): Promise<any> {
    try {
      await TradeExecutionDebugger.logExecutionStep('PYTHON_EXECUTION_START', {
        strategyCodeLength: strategyCode?.length || 0,
        marketDataKeys: Object.keys(marketData || {}),
        dataPoints: marketData?.close?.length || 0,
        sampleCloseData: marketData?.close?.slice(-5) || []
      });

      await this.initializePyodide();
      
      if (!this.pyodide) {
        throw new Error('Pyodide not initialized');
      }

      // Set market data in Python environment with debugging
      this.pyodide.globals.set('open_prices', marketData.open || []);
      this.pyodide.globals.set('high_prices', marketData.high || []);
      this.pyodide.globals.set('low_prices', marketData.low || []);
      this.pyodide.globals.set('close_prices', marketData.close || []);
      this.pyodide.globals.set('volume_data', marketData.volume || []);

      await TradeExecutionDebugger.logExecutionStep('PYTHON_DATA_SET', {
        openLength: marketData.open?.length || 0,
        highLength: marketData.high?.length || 0,
        lowLength: marketData.low?.length || 0,
        closeLength: marketData.close?.length || 0,
        volumeLength: marketData.volume?.length || 0
      });

      // Set up data dictionary in Python
      const dataSetup = `
# Convert data to numpy arrays
open_data = np.array(open_prices) if open_prices else np.array([])
high_data = np.array(high_prices) if high_prices else np.array([])
low_data = np.array(low_prices) if low_prices else np.array([])
close_data = np.array(close_prices) if close_prices else np.array([])
volume_data = np.array(volume_data) if volume_data else np.array([])

print(f"📊 Data loaded: {len(close_data)} data points")
if len(close_data) > 0:
    print(f"📈 Latest close price: {close_data[-1]}")

# Create data dictionary
data = {
    'open': open_data,
    'high': high_data,
    'low': low_data,
    'close': close_data,
    'volume': volume_data,
    'Open': open_data,  # Also provide capitalized versions
    'High': high_data,
    'Low': low_data,
    'Close': close_data,
    'Volume': volume_data
}
`;

      // Set the strategy code as a global variable
      this.pyodide.globals.set('strategy_code', strategyCode);
      
      // Execute data setup
      await this.pyodide.runPython(dataSetup);

      // Execute the strategy with enhanced error handling
      const result = await this.pyodide.runPython(`
try:
    strategy_result = execute_strategy(data)
    print(f"🎯 Strategy result type: {type(strategy_result)}")
    if isinstance(strategy_result, dict):
        print(f"📊 Result keys: {list(strategy_result.keys())}")
        if 'entry' in strategy_result:
            entry_signals = sum(1 for x in strategy_result['entry'] if x) if strategy_result['entry'] else 0
            print(f"🚨 Entry signals found: {entry_signals}")
        if 'direction' in strategy_result:
            directions = [str(d) for d in strategy_result['direction'] if d and str(d) != 'None']
            unique_dirs = set(directions)
            print(f"🎯 Directions found: {unique_dirs}")
    strategy_result
except Exception as e:
    print(f"❌ Final execution error: {e}")
    import traceback
    traceback.print_exc()
    {
        'entry': [False] * len(data['close']) if len(data['close']) > 0 else [False] * 100,
        'exit': [False] * len(data['close']) if len(data['close']) > 0 else [False] * 100,
        'direction': [None] * len(data['close']) if len(data['close']) > 0 else [None] * 100,
        'error': str(e)
    }
`);

      // Convert PyProxy to JavaScript object if needed
      const jsResult = result.toJs ? result.toJs({ dict_converter: Object.fromEntries }) : result;
      
      await TradeExecutionDebugger.logExecutionStep('PYTHON_EXECUTION_COMPLETE', {
        hasResult: !!jsResult,
        resultKeys: Object.keys(jsResult || {}),
        entrySignalsCount: jsResult?.entry?.filter?.(Boolean)?.length || 0,
        exitSignalsCount: jsResult?.exit?.filter?.(Boolean)?.length || 0,
        lastEntrySignal: jsResult?.entry?.[jsResult.entry.length - 1],
        lastDirection: jsResult?.direction?.[jsResult.direction.length - 1],
        error: jsResult?.error
      });

      return jsResult;

    } catch (error) {
      await TradeExecutionDebugger.logExecutionStep('PYTHON_EXECUTION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name
      });
      
      throw new Error(`Python execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  reset(): void {
    this.pyodide = null;
    this.isInitialized = false;
    console.log('🔄 Enhanced execution manager reset');
  }
}

// Bind to window for debugging
if (typeof window !== 'undefined') {
  (window as any).enhancedPythonExecutor = EnhancedExecutionManager.getInstance();
  console.log('🐍 Enhanced Python executor available: enhancedPythonExecutor');
}
