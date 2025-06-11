
// Lightweight Python setup without heavy pandas operations
export const LIGHTWEIGHT_PYTHON_SETUP = `
import numpy as np
import math
from typing import Dict, List, Any, Optional, Union

print("🐍 Lightweight Python environment initialized")

# Lightweight technical analysis functions (no pandas dependency)
class TechnicalAnalysis:
    @staticmethod
    def sma(data, period):
        """Simple Moving Average"""
        if len(data) < period:
            return [float('nan')] * len(data)
        
        result = []
        for i in range(len(data)):
            if i < period - 1:
                result.append(float('nan'))
            else:
                avg = sum(data[i-period+1:i+1]) / period
                result.append(avg)
        return result
    
    @staticmethod
    def ema(data, period):
        """Exponential Moving Average"""
        if not data or period <= 0:
            return [float('nan')] * len(data)
        
        multiplier = 2 / (period + 1)
        result = [float('nan')] * len(data)
        
        # Find first non-NaN value as starting point
        start_idx = 0
        while start_idx < len(data) and (math.isnan(data[start_idx]) if isinstance(data[start_idx], float) else False):
            start_idx += 1
        
        if start_idx >= len(data):
            return result
        
        result[start_idx] = data[start_idx]
        
        for i in range(start_idx + 1, len(data)):
            if not (math.isnan(data[i]) if isinstance(data[i], float) else False):
                result[i] = (data[i] * multiplier) + (result[i-1] * (1 - multiplier))
            else:
                result[i] = result[i-1]
        
        return result
    
    @staticmethod
    def rsi(data, period=14):
        """Relative Strength Index"""
        if len(data) < period + 1:
            return [float('nan')] * len(data)
        
        deltas = [data[i] - data[i-1] for i in range(1, len(data))]
        gains = [delta if delta > 0 else 0 for delta in deltas]
        losses = [-delta if delta < 0 else 0 for delta in deltas]
        
        avg_gain = sum(gains[:period]) / period
        avg_loss = sum(losses[:period]) / period
        
        result = [float('nan')] * (period)
        
        for i in range(period, len(data)):
            if avg_loss == 0:
                result.append(100)
            else:
                rs = avg_gain / avg_loss
                rsi = 100 - (100 / (1 + rs))
                result.append(rsi)
            
            if i < len(deltas):
                avg_gain = (avg_gain * (period - 1) + gains[i]) / period
                avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        
        return result
    
    @staticmethod
    def atr(high, low, close, period=14):
        """Average True Range"""
        if len(high) != len(low) or len(low) != len(close):
            return [float('nan')] * len(close)
        
        true_ranges = []
        for i in range(1, len(close)):
            hl = high[i] - low[i]
            hc = abs(high[i] - close[i-1])
            lc = abs(low[i] - close[i-1])
            true_ranges.append(max(hl, hc, lc))
        
        # Pad with NaN for first value
        tr_with_padding = [float('nan')] + true_ranges
        
        return TechnicalAnalysis.sma(tr_with_padding, period)

def execute_strategy(data):
    """Optimized strategy execution function"""
    try:
        print("🚀 Executing strategy with lightweight setup...")
        print(f"📊 Data type: {type(data)}")
        print(f"📊 Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        
        # CRITICAL FIX: Convert lists to proper format for strategy
        # The data comes as lists from JavaScript, need to handle .tolist() calls
        processed_data = {}
        for key, value in data.items():
            if isinstance(value, list):
                # Already a list, no need for .tolist()
                processed_data[key] = value
            else:
                # Convert to list if needed
                processed_data[key] = list(value) if hasattr(value, '__iter__') else [value]
        
        print(f"✅ Data processed for strategy execution")
        
        # Execute the user's strategy code with processed data
        local_vars = {
            'data': processed_data, 
            'TechnicalAnalysis': TechnicalAnalysis,
            'np': np,
            'math': math
        }
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
                    data_length = len(processed_data.get('close', [])) if isinstance(processed_data, dict) else 100
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

print("🎯 Lightweight strategy execution function defined successfully");
`;
