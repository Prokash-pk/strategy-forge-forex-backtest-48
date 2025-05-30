
export const ERROR_HANDLING_PYTHON_CODE = `
def create_fallback_result(market_data_dict, error_msg):
    """Create a fallback result when strategy execution fails"""
    try:
        data_length = len(list(market_data_dict.values())[0]) if market_data_dict else 0
    except:
        data_length = 0
        
    return {
        'entry': [False] * data_length,
        'exit': [False] * data_length,
        'error': error_msg
    }

def handle_strategy_error(e, market_data_dict):
    """Handle strategy execution errors and return appropriate fallback"""
    import traceback
    error_msg = f"Strategy execution error: {str(e)}\\n{traceback.format_exc()}"
    print(f"ERROR: {error_msg}")  # This will show in console
    
    return create_fallback_result(market_data_dict, error_msg)
`;
