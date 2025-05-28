
import { TECHNICAL_ANALYSIS_PYTHON_CODE } from './technicalAnalysis';

export const STRATEGY_EXECUTOR_PYTHON_CODE = `
${TECHNICAL_ANALYSIS_PYTHON_CODE}

def execute_strategy(market_data_dict: Dict[str, List[float]], strategy_code: str) -> Dict[str, Any]:
    """Execute the user's strategy code safely"""
    try:
        # Convert JavaScript data to proper Python lists with validation
        data_dict = {}
        
        # Convert JS data to Python, handling pyodide.ffi.JsProxy objects
        for key in ['open', 'high', 'low', 'close', 'volume']:
            if key in market_data_dict:
                raw_data = market_data_dict[key]
                
                # Handle pyodide.ffi.JsProxy objects by converting to Python
                if hasattr(raw_data, 'to_py'):
                    raw_data = raw_data.to_py()
                elif hasattr(raw_data, '__iter__') and not isinstance(raw_data, str):
                    # Convert iterable to list
                    raw_data = list(raw_data)
                
                # Ensure all values are properly converted to float
                converted_data = []
                for val in raw_data:
                    try:
                        if val is None or pd.isna(val):
                            converted_data.append(float('nan'))
                        else:
                            converted_data.append(float(val))
                    except (ValueError, TypeError):
                        converted_data.append(float('nan'))
                
                data_dict[key.capitalize()] = converted_data
            else:
                data_dict[key.capitalize()] = []
        
        # Ensure all data arrays have the same length
        if data_dict.get('Close'):
            data_length = len(data_dict['Close'])
            for key in data_dict:
                if len(data_dict[key]) != data_length:
                    if len(data_dict[key]) < data_length:
                        data_dict[key].extend([float('nan')] * (data_length - len(data_dict[key])))
                    else:
                        data_dict[key] = data_dict[key][:data_length]
        
        # Create DataFrame from validated data
        df = pd.DataFrame(data_dict)
        
        # Create a safe execution environment with enhanced TechnicalAnalysis
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
                'None': None,
                'True': True,
                'False': False,
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
        
        # Convert results to JavaScript-compatible format
        def convert_to_list(value):
            if hasattr(value, 'tolist'):
                # Handle pandas Series/arrays
                return [bool(x) if pd.notna(x) and isinstance(x, (bool, np.bool_)) else (False if pd.isna(x) else bool(x)) for x in value.tolist()]
            elif isinstance(value, list):
                # Handle Python lists
                converted = []
                for x in value:
                    if x is None or (hasattr(x, '__class__') and 'nan' in str(x).lower()):
                        converted.append(False)
                    else:
                        converted.append(bool(x))
                return converted
            return value
        
        def convert_indicator_values(value):
            if hasattr(value, 'tolist'):
                return [float(x) if pd.notna(x) else float('nan') for x in value.tolist()]
            elif isinstance(value, list):
                converted = []
                for x in value:
                    if x is None:
                        converted.append(float('nan'))
                    elif hasattr(x, '__class__') and 'nan' in str(x).lower():
                        converted.append(float('nan'))
                    else:
                        try:
                            converted.append(float(x))
                        except (ValueError, TypeError):
                            converted.append(float('nan'))
                return converted
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
                if hasattr(value, 'tolist') or isinstance(value, list):
                    processed_result['indicators'][key] = convert_indicator_values(value)
                elif isinstance(value, dict):
                    # Handle complex indicators like Bollinger Bands
                    processed_result['indicators'][key] = {}
                    for sub_key, sub_value in value.items():
                        processed_result['indicators'][key][sub_key] = convert_indicator_values(sub_value)
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
        print(f"ERROR: {error_msg}")  # This will show in console
        return {
            'entry': [False] * len(market_data_dict.get('close', [])),
            'exit': [False] * len(market_data_dict.get('close', [])),
            'error': error_msg
        }
`;
