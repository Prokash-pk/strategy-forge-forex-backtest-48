
import { PyodideManager } from './pyodideManager';

export class ExecutionManager {
  private static instance: ExecutionManager;
  private pyodide: any = null;

  static getInstance(): ExecutionManager {
    if (!ExecutionManager.instance) {
      ExecutionManager.instance = new ExecutionManager();
    }
    return ExecutionManager.instance;
  }

  async initializePyodide(): Promise<void> {
    if (!this.pyodide) {
      console.log('🔧 Initializing Pyodide...');
      this.pyodide = await PyodideManager.getInstance().getPyodide();
      console.log('✅ Pyodide initialized successfully');
    }
  }

  async executePythonStrategy(strategyCode: string, marketData: any): Promise<any> {
    try {
      await this.initializePyodide();
      
      if (!this.pyodide) {
        throw new Error('Pyodide not initialized');
      }

      console.log('✅ Pyodide instance ready');
      console.log('🚀 Executing Python strategy...');

      // Set market data in Python environment
      console.log('📤 Setting data in Python environment...');
      this.pyodide.globals.set('open_prices', marketData.open);
      this.pyodide.globals.set('high_prices', marketData.high);
      this.pyodide.globals.set('low_prices', marketData.low);
      this.pyodide.globals.set('close_prices', marketData.close);
      this.pyodide.globals.set('volume_data', marketData.volume);
      console.log('✅ Data set in Python environment');

      // Import required Python libraries and define execute_strategy function
      const pythonSetup = `
import numpy as np
import pandas as pd
import math
from typing import Dict, List, Any, Optional, Union

# Convert data to numpy arrays
open_data = np.array(open_prices)
high_data = np.array(high_prices)
low_data = np.array(low_prices)
close_data = np.array(close_prices)
volume_data = np.array(volume_data)

# Create data dictionary
data = {
    'open': open_data,
    'high': high_data,
    'low': low_data,
    'close': close_data,
    'volume': volume_data
}

def execute_strategy(data):
    """Main strategy execution function"""
    try:
        # Execute the user's strategy code
        local_vars = {'data': data}
        exec(strategy_code, globals(), local_vars)
        
        # Return the result from local variables
        if 'result' in local_vars:
            return local_vars['result']
        else:
            # If no result variable, try to construct one from common variables
            entry = local_vars.get('entry', [])
            exit = local_vars.get('exit', [])
            direction = local_vars.get('direction', local_vars.get('trade_direction', []))
            
            if not entry and not exit and not direction:
                # Try to find any boolean arrays that might be signals
                for key, value in local_vars.items():
                    if isinstance(value, (list, np.ndarray)) and len(value) > 0:
                        if key.lower() in ['buy_signals', 'sell_signals', 'signals', 'entries']:
                            entry = value
                            break
                
                # Generate basic signals if none found
                if not entry:
                    entry = [False] * len(data['close'])
                    exit = [False] * len(data['close'])
                    direction = [None] * len(data['close'])
            
            return {
                'entry': entry,
                'exit': exit if exit else [False] * len(entry),
                'direction': direction if direction else [None] * len(entry)
            }
    except Exception as e:
        print(f"Strategy execution error: {e}")
        return {
            'entry': [False] * len(data['close']),
            'exit': [False] * len(data['close']),
            'direction': [None] * len(data['close']),
            'error': str(e)
        }
`;

      // Set the strategy code as a global variable
      this.pyodide.globals.set('strategy_code', strategyCode);
      
      // Execute Python setup
      await this.pyodide.runPython(pythonSetup);

      // Check if execute_strategy function exists
      const hasExecuteFunction = await this.pyodide.runPython(`
'execute_strategy' in globals() and callable(execute_strategy)
`);

      console.log('✅ execute_strategy function found:', hasExecuteFunction);

      if (!hasExecuteFunction) {
        throw new Error('Python environment not properly initialized: execute_strategy function not found');
      }

      // Execute the strategy
      const result = await this.pyodide.runPython(`
try:
    strategy_result = execute_strategy(data)
    strategy_result
except Exception as e:
    {
        'entry': [False] * len(data['close']),
        'exit': [False] * len(data['close']),
        'direction': [None] * len(data['close']),
        'error': str(e)
    }
`);

      console.log('🎯 Strategy execution completed');
      
      // Convert PyProxy to JavaScript object if needed
      const jsResult = result.toJs ? result.toJs({ dict_converter: Object.fromEntries }) : result;
      
      console.log('📊 Strategy result:', {
        hasEntry: jsResult.entry?.length > 0,
        hasExit: jsResult.exit?.length > 0,
        hasDirection: jsResult.direction?.length > 0,
        entrySignals: jsResult.entry?.filter(Boolean).length || 0,
        error: jsResult.error
      });

      return jsResult;

    } catch (error) {
      console.error('❌ Python execution failed:', error);
      throw new Error(`Python environment not properly initialized: ${error.message}`);
    }
  }
}
