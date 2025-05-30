
import { TECHNICAL_ANALYSIS_PYTHON_CODE } from './technicalAnalysis';
import { DATA_VALIDATION_PYTHON_CODE } from './dataValidation';
import { SIGNAL_PROCESSING_PYTHON_CODE } from './signalProcessing';
import { STRATEGY_EXECUTION_PYTHON_CODE } from './strategyExecution';
import { ERROR_HANDLING_PYTHON_CODE } from './errorHandling';

export const STRATEGY_EXECUTOR_PYTHON_CODE = `
${TECHNICAL_ANALYSIS_PYTHON_CODE}
${DATA_VALIDATION_PYTHON_CODE}
${SIGNAL_PROCESSING_PYTHON_CODE}
${STRATEGY_EXECUTION_PYTHON_CODE}
${ERROR_HANDLING_PYTHON_CODE}

def execute_strategy(market_data_dict: Dict[str, List[float]], strategy_code: str) -> Dict[str, Any]:
    """Execute the user's strategy code safely with enhanced S&R and pattern recognition"""
    try:
        # Convert JavaScript data to proper Python lists with validation
        data_dict = validate_and_convert_market_data(market_data_dict)
        
        # Extract reverse_signals flag from market data
        reverse_signals = extract_reverse_signals_flag(market_data_dict)
        print(f"Python executor: reverse_signals = {reverse_signals}")
        
        # Create DataFrame from validated data
        df = pd.DataFrame(data_dict)
        
        # Create a safe execution environment with enhanced classes
        safe_globals = create_safe_execution_environment(df)
        
        # Execute the strategy code
        result = execute_strategy_code(strategy_code, safe_globals, reverse_signals)
        
        # Process and convert results to JavaScript-compatible format
        processed_result = process_strategy_signals(result, reverse_signals)
        
        # Ensure entry and exit signals exist
        data_length = len(data_dict.get('Close', []))
        processed_result = ensure_signal_arrays(processed_result, data_length)
        
        return processed_result
        
    except Exception as e:
        return handle_strategy_error(e, market_data_dict)
`;
