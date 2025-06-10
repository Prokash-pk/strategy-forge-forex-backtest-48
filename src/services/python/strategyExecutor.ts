
import { TECHNICAL_ANALYSIS_PYTHON_CODE } from './technicalAnalysis';
import { DATA_VALIDATION_PYTHON_CODE } from './dataValidation';
import { SIGNAL_PROCESSING_PYTHON_CODE } from './signalProcessing';
import { STRATEGY_EXECUTION_PYTHON_CODE } from './strategyExecution';
import { ERROR_HANDLING_PYTHON_CODE } from './errorHandling';

export const STRATEGY_EXECUTOR_PYTHON_CODE = `
# Import necessary typing modules at the top
import typing
from typing import Dict, List, Any, Union, Optional
import pandas as pd
import numpy as np
import math

${TECHNICAL_ANALYSIS_PYTHON_CODE}
${DATA_VALIDATION_PYTHON_CODE}
${SIGNAL_PROCESSING_PYTHON_CODE}
${STRATEGY_EXECUTION_PYTHON_CODE}
${ERROR_HANDLING_PYTHON_CODE}

def execute_strategy(market_data_dict: Dict[str, List[float]], strategy_code: str) -> Dict[str, Any]:
    """Execute the user's strategy code safely with complete technical analysis support"""
    try:
        print("🐍 Starting strategy execution...")
        
        # Debug: Print the type and structure of market_data_dict
        print(f"📊 Market data type: {type(market_data_dict)}")
        
        # Convert JavaScript data to proper Python with enhanced handling
        print("🔄 Converting market data...")
        data_dict = validate_and_convert_market_data(market_data_dict)
        
        if not data_dict.get('Close'):
            return {
                'entry': [],
                'exit': [],
                'direction': [],
                'error': 'No price data available'
            }
        
        # Extract reverse_signals flag
        reverse_signals = extract_reverse_signals_flag(market_data_dict)
        
        print(f"📈 Data converted successfully: {len(data_dict['Close'])} bars")
        print(f"🔄 Reverse signals: {reverse_signals}")
        
        # Create DataFrame from validated data
        df = pd.DataFrame(data_dict)
        print("📋 DataFrame created successfully")
        
        # Create safe execution environment with all technical analysis tools
        safe_globals = create_safe_execution_environment(df)
        print("🛡️ Safe execution environment created")
        
        # Execute the strategy code
        print("🚀 Executing strategy code...")
        result = execute_strategy_code(strategy_code, safe_globals, reverse_signals)
        
        if isinstance(result, dict) and result.get('error'):
            print(f"❌ Strategy returned error: {result['error']}")
            return result
        
        # Process and convert results
        print("⚙️ Processing strategy results...")
        processed_result = process_strategy_signals(result, reverse_signals)
        
        # Ensure minimum required arrays
        data_length = len(data_dict.get('Close', []))
        processed_result = ensure_signal_arrays(processed_result, data_length)
        
        print(f"✅ Strategy execution completed successfully")
        print(f"📊 Signals generated: Entry={sum(processed_result.get('entry', []))}, "
              f"BUY={processed_result.get('signal_stats', {}).get('buy_signals', 0)}, "
              f"SELL={processed_result.get('signal_stats', {}).get('sell_signals', 0)}")
        
        return processed_result
        
    except Exception as e:
        error_msg = f"Critical strategy execution error: {str(e)}"
        print(f"❌ {error_msg}")
        import traceback
        print(f"📍 Full traceback: {traceback.format_exc()}")
        
        return handle_strategy_error(e, market_data_dict)
`;
