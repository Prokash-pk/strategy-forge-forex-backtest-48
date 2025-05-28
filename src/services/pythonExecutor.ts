
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

def execute_strategy(market_data_dict: Dict[str, List[float]], strategy_code: str) -> Dict[str, Any]:
    """Execute the user's strategy code safely"""
    try:
        # Convert JavaScript data to proper Python lists
        data_dict = {
            'Open': list(market_data_dict['open']),
            'High': list(market_data_dict['high']),
            'Low': list(market_data_dict['low']),
            'Close': list(market_data_dict['close']),
            'Volume': list(market_data_dict['volume'])
        }
        
        # Create DataFrame from converted data
        df = pd.DataFrame(data_dict)
        
        # Create a safe execution environment
        safe_globals = {
            'pd': pd,
            'np': np,
            'data': df,
            'TechnicalAnalysis': TechnicalAnalysis,
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
                else:
                    processed_result['indicators'][key] = value
        
        # Ensure entry and exit signals exist
        data_length = len(data_dict['Close'])
        if 'entry' not in processed_result:
            processed_result['entry'] = [False] * data_length
        if 'exit' not in processed_result:
            processed_result['exit'] = [False] * data_length
        
        return processed_result
        
    except Exception as e:
        import traceback
        error_msg = f"Strategy execution error: {str(e)}\\n{traceback.format_exc()}"
        return {
            'entry': [False] * len(market_data_dict['close']),
            'exit': [False] * len(market_data_dict['close']),
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
      
      // Convert market data to plain JavaScript object
      const plainMarketData = {
        open: Array.from(marketData.open),
        high: Array.from(marketData.high),
        low: Array.from(marketData.low),
        close: Array.from(marketData.close),
        volume: Array.from(marketData.volume)
      };
      
      // Set the data and code in Python using proper conversion
      pyodide.globals.set('js_market_data', plainMarketData);
      pyodide.globals.set('js_strategy_code', code);
      
      // Execute the strategy with proper data conversion
      const result = pyodide.runPython(`
# Convert JS data to Python and execute strategy
result = execute_strategy(js_market_data.to_py(), js_strategy_code)
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
