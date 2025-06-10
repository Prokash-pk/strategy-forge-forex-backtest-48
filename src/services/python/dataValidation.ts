
export const DATA_VALIDATION_PYTHON_CODE = `
def validate_and_convert_market_data(market_data_dict):
    """Convert and validate market data from JavaScript to Python with improved JsProxy handling"""
    data_dict = {}
    
    # Handle different types of JavaScript objects properly
    js_keys = ['open', 'high', 'low', 'close', 'volume']
    
    for key in js_keys:
        try:
            # Try multiple access methods for different JS object types
            if hasattr(market_data_dict, 'get'):
                # Dictionary-like object
                raw_data = market_data_dict.get(key, [])
            elif hasattr(market_data_dict, '__getitem__'):
                # Array-like or object with bracket notation
                try:
                    raw_data = market_data_dict[key]
                except (KeyError, TypeError):
                    raw_data = []
            else:
                # Try attribute access
                raw_data = getattr(market_data_dict, key, [])
            
            # Convert JsProxy to Python
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
                    if val is None or (hasattr(val, '__class__') and 'nan' in str(val.__class__)):
                        converted_data.append(float('nan'))
                    else:
                        converted_data.append(float(val))
                except (ValueError, TypeError):
                    converted_data.append(float('nan'))
            
            data_dict[key.capitalize()] = converted_data
            
        except Exception as e:
            print(f"Warning: Error processing {key}: {e}")
            data_dict[key.capitalize()] = []
    
    # Ensure all data arrays have the same length
    if data_dict.get('Close'):
        data_length = len(data_dict['Close'])
        for key in data_dict:
            current_length = len(data_dict[key])
            if current_length != data_length:
                if current_length < data_length:
                    # Pad with NaN
                    data_dict[key].extend([float('nan')] * (data_length - current_length))
                else:
                    # Truncate
                    data_dict[key] = data_dict[key][:data_length]
    
    print(f"✅ Converted market data: {len(data_dict.get('Close', []))} data points")
    return data_dict

def extract_reverse_signals_flag(market_data_dict):
    """Extract reverse_signals flag from market data with enhanced error handling"""
    try:
        reverse_signals = False
        
        # Try multiple access methods
        if hasattr(market_data_dict, 'get'):
            reverse_signals = market_data_dict.get('reverse_signals', False)
        elif hasattr(market_data_dict, '__getitem__'):
            try:
                reverse_signals = market_data_dict['reverse_signals']
            except (KeyError, TypeError):
                reverse_signals = False
        else:
            reverse_signals = getattr(market_data_dict, 'reverse_signals', False)
        
        # Convert JsProxy to Python if needed
        if hasattr(reverse_signals, 'to_py'):
            reverse_signals = reverse_signals.to_py()
        
        reverse_signals = bool(reverse_signals)
        print(f"📊 Extracted reverse_signals flag: {reverse_signals}")
        
    except Exception as e:
        print(f"Warning: Could not extract reverse_signals flag: {e}")
        reverse_signals = False
    
    return reverse_signals
`;
