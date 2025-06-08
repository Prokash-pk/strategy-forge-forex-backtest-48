
export const DATA_VALIDATION_PYTHON_CODE = `
def validate_and_convert_market_data(market_data_dict):
    """Convert and validate market data from JavaScript to Python"""
    data_dict = {}
    
    # Convert JS data to Python, handling pyodide.ffi.JsProxy objects properly
    js_keys = ['open', 'high', 'low', 'close', 'volume']
    
    for key in js_keys:
        # Check if key exists using try/except instead of 'in' operator
        try:
            raw_data = market_data_dict[key] if hasattr(market_data_dict, '__getitem__') else getattr(market_data_dict, key, [])
        except (KeyError, AttributeError):
            raw_data = []
        
        # Handle pyodide.ffi.JsProxy objects by converting to Python
        if hasattr(raw_data, 'to_py'):
            raw_data = raw_data.to_py()
        elif hasattr(raw_data, '__iter__') and not isinstance(raw_data, str):
            # Convert iterable to list
            try:
                raw_data = list(raw_data)
            except:
                raw_data = []
        
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
    
    # Ensure all data arrays have the same length
    if data_dict.get('Close'):
        data_length = len(data_dict['Close'])
        for key in data_dict:
            if len(data_dict[key]) != data_length:
                if len(data_dict[key]) < data_length:
                    data_dict[key].extend([float('nan')] * (data_length - len(data_dict[key])))
                else:
                    data_dict[key] = data_dict[key][:data_length]
    
    return data_dict

def extract_reverse_signals_flag(market_data_dict):
    """Extract reverse_signals flag from market data with safer access"""
    try:
        # Use safer access methods for different data structures
        if hasattr(market_data_dict, 'get'):
            reverse_signals = market_data_dict.get('reverse_signals', False)
        elif hasattr(market_data_dict, '__getitem__'):
            try:
                reverse_signals = market_data_dict['reverse_signals']
            except (KeyError, TypeError):
                reverse_signals = False
        else:
            reverse_signals = getattr(market_data_dict, 'reverse_signals', False)
        
        if hasattr(reverse_signals, 'to_py'):
            reverse_signals = reverse_signals.to_py()
        reverse_signals = bool(reverse_signals)
    except Exception as e:
        print(f"Warning: Could not extract reverse_signals flag: {e}")
        reverse_signals = False
    
    return reverse_signals
`;
