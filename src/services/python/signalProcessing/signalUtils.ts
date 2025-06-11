
export const SIGNAL_UTILS_PYTHON_CODE = `
def ensure_signal_arrays(result, data_length):
    """Ensure signal arrays have the correct length"""
    
    # Ensure basic arrays exist and have correct length
    for key in ['entry', 'exit', 'direction']:
        if key not in result:
            result[key] = []
        
        current_length = len(result[key])
        if current_length < data_length:
            # Pad with appropriate default values
            if key == 'direction':
                result[key].extend([None] * (data_length - current_length))
            else:
                result[key].extend([False] * (data_length - current_length))
        elif current_length > data_length:
            # Truncate to match data length
            result[key] = result[key][:data_length]
    
    return result

def extract_reverse_signals_flag(market_data_dict):
    """Extract reverse signals flag from market data"""
    return market_data_dict.get('reverse_signals', False)
`;
