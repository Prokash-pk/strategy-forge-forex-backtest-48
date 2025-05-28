
declare global {
  interface Window {
    loadPyodide: any;
    pyodide: any;
  }
}

interface StrategyResult {
  entry: boolean[];
  exit: boolean[];
  indicators?: Record<string, number[]>;
  error?: string;
}

interface MarketData {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

export class PythonExecutor {
  private static pyodideInstance: any = null;
  private static isLoading = false;
  private static loadPromise: Promise<any> | null = null;

  static async initializePyodide(): Promise<any> {
    if (this.pyodideInstance) {
      return this.pyodideInstance;
    }

    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = this.loadPyodideInternal();
    
    try {
      this.pyodideInstance = await this.loadPromise;
      return this.pyodideInstance;
    } finally {
      this.isLoading = false;
    }
  }

  private static async loadPyodideInternal(): Promise<any> {
    // Load Pyodide from CDN
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Pyodide'));
        document.head.appendChild(script);
      });
    }

    console.log('Loading Pyodide...');
    const pyodide = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
    });

    // Install required packages
    console.log('Installing Python packages...');
    await pyodide.loadPackage(['numpy', 'pandas']);

    // Set up the Python environment with helper functions
    pyodide.runPython(`
import pandas as pd
import numpy as np
from typing import Dict, List, Any
import json
import math

class TechnicalAnalysis:
    @staticmethod
    def sma(data: List[float], period: int) -> List[float]:
        """Simple Moving Average"""
        result = []
        for i in range(len(data)):
            if i < period - 1:
                result.append(float('nan'))
            else:
                avg = sum(data[i-period+1:i+1]) / period
                result.append(avg)
        return result
    
    @staticmethod
    def ema(data: List[float], period: int) -> List[float]:
        """Exponential Moving Average"""
        if not data:
            return []
        
        result = [data[0]]
        multiplier = 2 / (period + 1)
        
        for i in range(1, len(data)):
            ema_val = (data[i] * multiplier) + (result[i-1] * (1 - multiplier))
            result.append(ema_val)
        
        return result
    
    @staticmethod
    def rsi(data: List[float], period: int = 14) -> List[float]:
        """Relative Strength Index"""
        if len(data) < period + 1:
            return [float('nan')] * len(data)
        
        gains = []
        losses = []
        
        for i in range(1, len(data)):
            change = data[i] - data[i-1]
            gains.append(max(change, 0))
            losses.append(max(-change, 0))
        
        result = [float('nan')]
        
        for i in range(len(gains)):
            if i < period - 1:
                result.append(float('nan'))
            else:
                avg_gain = sum(gains[i-period+1:i+1]) / period
                avg_loss = sum(losses[i-period+1:i+1]) / period
                
                if avg_loss == 0:
                    result.append(100)
                else:
                    rs = avg_gain / avg_loss
                    rsi_val = 100 - (100 / (1 + rs))
                    result.append(rsi_val)
        
        return result

    @staticmethod
    def stddev(data: List[float], period: int) -> List[float]:
        """Standard Deviation"""
        result = []
        for i in range(len(data)):
            if i < period - 1:
                result.append(float('nan'))
            else:
                slice_data = data[i-period+1:i+1]
                mean = sum(slice_data) / len(slice_data)
                variance = sum((x - mean) ** 2 for x in slice_data) / len(slice_data)
                result.append(math.sqrt(variance))
        return result
    
    @staticmethod
    def bollinger_bands(data: List[float], period: int = 20, std_dev: float = 2):
        """Bollinger Bands"""
        sma = TechnicalAnalysis.sma(data, period)
        std = TechnicalAnalysis.stddev(data, period)
        
        upper = []
        lower = []
        
        for i in range(len(data)):
            if math.isnan(sma[i]) or math.isnan(std[i]):
                upper.append(float('nan'))
                lower.append(float('nan'))
            else:
                upper.append(sma[i] + (std[i] * std_dev))
                lower.append(sma[i] - (std[i] * std_dev))
        
        return {
            'upper': upper,
            'middle': sma,
            'lower': lower
        }
    
    @staticmethod
    def macd(data: List[float], fast: int = 12, slow: int = 26, signal: int = 9):
        """MACD Indicator"""
        ema_fast = TechnicalAnalysis.ema(data, fast)
        ema_slow = TechnicalAnalysis.ema(data, slow)
        
        macd_line = []
        for i in range(len(data)):
            macd_line.append(ema_fast[i] - ema_slow[i])
        
        # Remove NaN values for signal calculation
        valid_macd = [x for x in macd_line if not math.isnan(x)]
        signal_line = TechnicalAnalysis.ema(valid_macd, signal)
        
        # Pad signal line to match original length
        padded_signal = [float('nan')] * (len(macd_line) - len(signal_line)) + signal_line
        
        histogram = []
        for i in range(len(macd_line)):
            if math.isnan(macd_line[i]) or math.isnan(padded_signal[i]):
                histogram.append(float('nan'))
            else:
                histogram.append(macd_line[i] - padded_signal[i])
        
        return {
            'macd': macd_line,
            'signal': padded_signal,
            'histogram': histogram
        }
    
    @staticmethod
    def stochastic(high: List[float], low: List[float], close: List[float], k_period: int = 14, d_period: int = 3):
        """Stochastic Oscillator"""
        k_percent = []
        
        for i in range(len(close)):
            if i < k_period - 1:
                k_percent.append(float('nan'))
            else:
                period_high = max(high[i-k_period+1:i+1])
                period_low = min(low[i-k_period+1:i+1])
                
                if period_high == period_low:
                    k_percent.append(50)
                else:
                    k_val = ((close[i] - period_low) / (period_high - period_low)) * 100
                    k_percent.append(k_val)
        
        # Calculate %D (SMA of %K)
        d_percent = TechnicalAnalysis.sma([x for x in k_percent if not math.isnan(x)], d_period)
        padded_d = [float('nan')] * (len(k_percent) - len(d_percent)) + d_percent
        
        return {
            'k': k_percent,
            'd': padded_d
        }

def execute_strategy(market_data_dict: Dict[str, List[float]], strategy_code: str) -> Dict[str, Any]:
    """Execute the user's strategy code safely"""
    try:
        # Convert JavaScript data to proper Python lists with validation
        data_dict = {}
        
        for key in ['open', 'high', 'low', 'close', 'volume']:
            if key in market_data_dict:
                # Convert to list and ensure all values are floats
                raw_data = market_data_dict[key]
                if hasattr(raw_data, 'to_py'):
                    raw_data = raw_data.to_py()
                
                converted_data = []
                for val in raw_data:
                    try:
                        converted_data.append(float(val))
                    except (ValueError, TypeError):
                        converted_data.append(float('nan'))
                
                data_dict[key.capitalize()] = converted_data
            else:
                # Provide default empty list if key is missing
                data_dict[key.capitalize()] = []
        
        # Ensure all data arrays have the same length
        if data_dict['Close']:
            data_length = len(data_dict['Close'])
            for key in data_dict:
                if len(data_dict[key]) != data_length:
                    # Pad or truncate to match close data length
                    if len(data_dict[key]) < data_length:
                        data_dict[key].extend([float('nan')] * (data_length - len(data_dict[key])))
                    else:
                        data_dict[key] = data_dict[key][:data_length]
        
        # Create DataFrame from validated data
        df = pd.DataFrame(data_dict)
        
        # Create a safe execution environment
        safe_globals = {
            'pd': pd,
            'np': np,
            'data': df,
            'TechnicalAnalysis': TechnicalAnalysis,
            'math': math,
            '__builtins__': {
                'len': len,
                'range': range,
                'sum': sum,
                'max': max,
                'min': min,
                'abs': abs,
                'round': round,
                'float': float,
                'int': int,
                'bool': bool,
                'list': list,
                'dict': dict,
                'enumerate': enumerate,
                'zip': zip,
                'any': any,
                'all': all,
            }
        }
        
        # Execute the strategy code
        exec(strategy_code, safe_globals)
        
        # Try to call strategy_logic function
        if 'strategy_logic' in safe_globals:
            result = safe_globals['strategy_logic'](df)
        else:
            # If no function found, try to extract signals from globals
            result = {}
            if 'entry' in safe_globals:
                result['entry'] = safe_globals['entry']
            if 'exit' in safe_globals:
                result['exit'] = safe_globals['exit']
        
        # Convert pandas Series to lists and handle NaN values
        def convert_to_list(value):
            if hasattr(value, 'tolist'):
                return [bool(x) if pd.notna(x) and (x is True or x is False) else (False if pd.isna(x) else bool(x)) for x in value.tolist()]
            elif isinstance(value, list):
                return [bool(x) if x is not None and not pd.isna(x) else False for x in value]
            return value
        
        # Process the result
        processed_result = {}
        for key, value in result.items():
            if key in ['entry', 'exit']:
                processed_result[key] = convert_to_list(value)
            else:
                # Handle indicators
                if 'indicators' not in processed_result:
                    processed_result['indicators'] = {}
                if hasattr(value, 'tolist'):
                    processed_result['indicators'][key] = [float(x) if pd.notna(x) else float('nan') for x in value.tolist()]
                elif isinstance(value, dict):
                    # Handle complex indicators like Bollinger Bands
                    processed_result['indicators'][key] = {}
                    for sub_key, sub_value in value.items():
                        if hasattr(sub_value, 'tolist'):
                            processed_result['indicators'][key][sub_key] = [float(x) if pd.notna(x) else float('nan') for x in sub_value.tolist()]
                        else:
                            processed_result['indicators'][key][sub_key] = sub_value
                else:
                    processed_result['indicators'][key] = value
        
        # Ensure entry and exit signals exist
        data_length = len(data_dict.get('Close', []))
        if 'entry' not in processed_result:
            processed_result['entry'] = [False] * data_length
        if 'exit' not in processed_result:
            processed_result['exit'] = [False] * data_length
        
        return processed_result
        
    except Exception as e:
        import traceback
        error_msg = f"Strategy execution error: {str(e)}\\n{traceback.format_exc()}"
        return {
            'entry': [False] * len(market_data_dict.get('close', [])),
            'exit': [False] * len(market_data_dict.get('close', [])),
            'error': error_msg
        }
    `);

    console.log('Pyodide initialized successfully');
    return pyodide;
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
    try {
      await this.initializePyodide();
      return true;
    } catch {
      return false;
    }
  }
}
