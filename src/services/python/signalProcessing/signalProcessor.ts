
export const SIGNAL_PROCESSOR_PYTHON_CODE = `
def process_strategy_signals(result, reverse_signals):
    """Process and validate strategy signals with enforced directional structure"""
    
    # Ensure we have the basic required signals
    if not isinstance(result, dict):
        return {'entry': [], 'exit': [], 'direction': [], 'error': 'Invalid strategy result format'}
    
    # Enforce directional signals (this will auto-generate if missing)
    result = enforce_directional_signals(result)
    
    # Extract signals with proper fallback order
    entry = result.get('entry', [])
    exit = result.get('exit', [])
    direction = result.get('direction', result.get('entry_type', result.get('trade_direction', [])))
    
    # Final validation after potential auto-generation
    is_valid, validation_message = validate_strategy_signals(result)
    
    if not is_valid:
        print(f"❌ Final validation failed: {validation_message}")
        return {
            'entry': [], 
            'exit': [], 
            'direction': [], 
            'error': f"Strategy validation failed: {validation_message}"
        }
    
    # Apply reverse signals if requested
    if reverse_signals and direction:
        print("🔄 Applying reverse signals transformation")
        reversed_direction = []
        for dir_signal in direction:
            if dir_signal == 'BUY':
                reversed_direction.append('SELL')
            elif dir_signal == 'SELL':
                reversed_direction.append('BUY')
            else:
                reversed_direction.append(dir_signal)
        direction = reversed_direction
    
    # Convert to JavaScript-compatible format
    processed_result = {
        'entry': [bool(x) for x in entry] if entry else [],
        'exit': [bool(x) for x in exit] if exit else [],
        'direction': [str(x) if x is not None and x != 'None' else None for x in direction] if direction else [],
        'reverse_signals_applied': reverse_signals,
        'validation_passed': True,
        'validation_message': validation_message,
        'auto_generated_direction': result.get('auto_generated_direction', False),
        'signal_stats': {
            'total_entries': sum(entry) if entry else 0,
            'buy_signals': direction.count('BUY') if direction else 0,
            'sell_signals': direction.count('SELL') if direction else 0
        }
    }
    
    # Include other indicators if present
    for key, value in result.items():
        if key not in ['entry', 'exit', 'direction', 'entry_type', 'trade_direction']:
            if hasattr(value, '__iter__') and not isinstance(value, str):
                try:
                    processed_result[key] = [float(x) if not math.isnan(x) else 0 for x in value]
                except (TypeError, ValueError):
                    processed_result[key] = value
            else:
                processed_result[key] = value
    
    return processed_result
`;
