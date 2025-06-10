
export const STRATEGY_EXECUTION_PYTHON_CODE = `
def create_safe_execution_environment(df):
    """Create a safe execution environment with all technical analysis classes"""
    return {
        'pd': pd,
        'np': np,
        'data': df,
        'TechnicalAnalysis': TechnicalAnalysis,
        'AdvancedTechnicalAnalysis': AdvancedTechnicalAnalysis,
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
            'print': print,
        }
    }

def execute_strategy_code(strategy_code, safe_globals, reverse_signals):
    """Execute the strategy code and return results with enhanced error handling"""
    try:
        # Execute the strategy code in safe environment
        exec(strategy_code, safe_globals)
        
        # Try to call strategy_logic function
        if 'strategy_logic' in safe_globals:
            strategy_func = safe_globals['strategy_logic']
            
            # Check function signature to determine parameters
            import inspect
            try:
                sig = inspect.signature(strategy_func)
                params = list(sig.parameters.keys())
                
                # Call with appropriate parameters
                if 'reverse_signals' in params:
                    result = strategy_func(safe_globals['data'], reverse_signals=reverse_signals)
                else:
                    result = strategy_func(safe_globals['data'])
                    
            except Exception as sig_error:
                print(f"Warning: Signature inspection failed: {sig_error}")
                # Fallback to simple call
                try:
                    result = strategy_func(safe_globals['data'], reverse_signals)
                except:
                    result = strategy_func(safe_globals['data'])
        else:
            # If no function found, look for direct variables
            result = {}
            for var_name in ['entry', 'exit', 'direction', 'signals']:
                if var_name in safe_globals:
                    result[var_name] = safe_globals[var_name]
        
        return result
        
    except Exception as e:
        print(f"❌ Strategy execution error: {str(e)}")
        import traceback
        print(f"📍 Traceback: {traceback.format_exc()}")
        
        # Return error result
        return {
            'entry': [],
            'exit': [],
            'direction': [],
            'error': f"Strategy execution failed: {str(e)}"
        }
`;
