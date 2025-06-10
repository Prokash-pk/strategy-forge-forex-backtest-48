
export const STRATEGY_EXECUTION_PYTHON_CODE = `
def create_safe_execution_environment(df):
    """Create a safe execution environment with enhanced classes"""
    return {
        'pd': pd,
        'np': np,
        'data': df,
        'TechnicalAnalysis': TechnicalAnalysis,
        'AdvancedTechnicalAnalysis': AdvancedTechnicalAnalysis,
        'SupportResistanceDetection': SupportResistanceDetection if 'SupportResistanceDetection' in globals() else None,
        'PriceActionPatterns': PriceActionPatterns if 'PriceActionPatterns' in globals() else None,
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

def execute_strategy_code(strategy_code, safe_globals, reverse_signals):
    """Execute the strategy code and return results"""
    # Execute the strategy code
    exec(strategy_code, safe_globals)
    
    # Try to call strategy_logic function with reverse_signals parameter
    if 'strategy_logic' in safe_globals:
        # Check if strategy_logic accepts reverse_signals parameter
        import inspect
        sig = inspect.signature(safe_globals['strategy_logic'])
        if 'reverse_signals' in sig.parameters:
            result = safe_globals['strategy_logic'](safe_globals['data'], reverse_signals=reverse_signals)
        else:
            result = safe_globals['strategy_logic'](safe_globals['data'])
    else:
        # If no function found, try to extract signals from globals
        result = {}
        if 'entry' in safe_globals:
            result['entry'] = safe_globals['entry']
        if 'exit' in safe_globals:
            result['exit'] = safe_globals['exit']
    
    return result
`;
