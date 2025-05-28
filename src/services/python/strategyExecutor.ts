
import { TECHNICAL_ANALYSIS_PYTHON_CODE } from './technicalAnalysis';

export const STRATEGY_EXECUTOR_PYTHON_CODE = `
${TECHNICAL_ANALYSIS_PYTHON_CODE}

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
`;
