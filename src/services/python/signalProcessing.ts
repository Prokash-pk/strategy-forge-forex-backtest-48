
export const SIGNAL_PROCESSING_PYTHON_CODE = `
def process_strategy_signals(result, reverse_signals):
    """Process and convert strategy signals to JavaScript-compatible format"""
    
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

    # Apply reverse signals if not handled by strategy and reverse_signals is True
    if reverse_signals and 'reverse_signals_applied' not in result:
        print("Applying signal reversal in Python executor")
        if 'entry' in result and 'exit' in result:
            # Swap entry and exit signals
            original_entry = result['entry'].copy() if hasattr(result['entry'], 'copy') else list(result['entry'])
            original_exit = result['exit'].copy() if hasattr(result['exit'], 'copy') else list(result['exit'])
            result['entry'] = original_exit
            result['exit'] = original_entry
            result['reverse_signals_applied'] = True
            print(f"Reversed signals: {sum(result['entry'])} entry signals after reversal")

    # Process the result
    processed_result = {}
    for key, value in result.items():
        if key in ['entry', 'exit']:
            processed_result[key] = convert_to_list(value)
        elif key in ['reverse_signals_applied']:
            processed_result[key] = bool(value)
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

    return processed_result

def ensure_signal_arrays(processed_result, data_length):
    """Ensure entry and exit signals exist and have correct length"""
    if 'entry' not in processed_result:
        processed_result['entry'] = [False] * data_length
    if 'exit' not in processed_result:
        processed_result['exit'] = [False] * data_length
    
    return processed_result
`;
