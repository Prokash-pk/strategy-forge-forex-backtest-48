
export const PYTHON_STRATEGY_SETUP_CODE = `
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

export const PYTHON_DATA_SETUP_CODE = `
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
