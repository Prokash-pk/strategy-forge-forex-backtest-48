
export const SIGNAL_PROCESSING_PYTHON_CODE = `
def validate_strategy_signals(result):
    """Validate that strategy returns proper directional signals"""
    
    if not isinstance(result, dict):
        return False, "Strategy must return a dictionary"
    
    entry = result.get('entry', [])
    exit = result.get('exit', [])
    # Check for 'direction' first (your strategy uses this), then fallbacks
    direction = result.get('direction', result.get('entry_type', result.get('trade_direction', [])))
    
    # Check required fields exist
    if not entry:
        return False, "Strategy must return 'entry' array"
    
    if not exit:
        return False, "Strategy must return 'exit' array"
    
    if not direction:
        return False, "Strategy must return 'direction' array with BUY/SELL/None signals"
    
    # Check array lengths match
    if len(entry) != len(exit) or len(entry) != len(direction):
        return False, f"Arrays must be same length: entry({len(entry)}), exit({len(exit)}), direction({len(direction)})"
    
    # Validate direction values - allow None, null, and string values
    valid_directions = ['BUY', 'SELL', None, 'None', 'NONE']
    invalid_directions = [d for d in direction if d not in valid_directions]
    if invalid_directions:
        return False, f"Invalid direction values: {set(invalid_directions)}. Must be 'BUY', 'SELL', or None"
    
    # Check for actual trading signals
    buy_signals = sum(1 for i, (has_entry, dir_signal) in enumerate(zip(entry, direction)) 
                     if has_entry and dir_signal == 'BUY')
    sell_signals = sum(1 for i, (has_entry, dir_signal) in enumerate(zip(entry, direction)) 
                      if has_entry and dir_signal == 'SELL')
    
    if buy_signals == 0 and sell_signals == 0:
        return False, "Strategy generates no BUY or SELL signals. Check your entry conditions."
    
    return True, f"✅ Strategy valid: {buy_signals} BUY signals, {sell_signals} SELL signals"

def enforce_directional_signals(result):
    """Enforce that strategies have proper directional signals"""
    
    # First validate the existing structure
    is_valid, message = validate_strategy_signals(result)
    
    if is_valid:
        print(f"📊 {message}")
        return result
    
    print(f"⚠️ Strategy validation failed: {message}")
    print("🔧 Attempting to auto-fix strategy signals...")
    
    # Try to auto-fix missing directional signals
    entry = result.get('entry', [])
    exit = result.get('exit', [])
    
    if not entry:
        print("❌ Cannot fix: No entry signals found")
        return {'entry': [], 'exit': [], 'direction': [], 'error': message}
    
    # Auto-generate direction based on simple momentum
    direction = []
    close_prices = result.get('close', [])
    
    for i, has_entry in enumerate(entry):
        if not has_entry:
            direction.append(None)
        else:
            # Simple heuristic: if we have price data, use momentum
            if close_prices and len(close_prices) > i and i > 0:
                if close_prices[i] > close_prices[i-1]:
                    direction.append('BUY')
                else:
                    direction.append('SELL')
            else:
                # Default to BUY if no price context
                direction.append('BUY')
    
    # Update result with auto-generated signals
    result['direction'] = direction
    result['auto_fixed'] = True
    result['original_error'] = message
    
    print(f"🔧 Auto-fixed strategy with {direction.count('BUY')} BUY and {direction.count('SELL')} SELL signals")
    
    return result

def process_strategy_signals(result, reverse_signals):
    """Process and validate strategy signals with enforced directional structure"""
    
    # Ensure we have the basic required signals
    if not isinstance(result, dict):
        return {'entry': [], 'exit': [], 'direction': [], 'error': 'Invalid strategy result format'}
    
    # Enforce directional signals (this will auto-fix if possible)
    result = enforce_directional_signals(result)
    
    # Extract signals with proper fallback order: direction -> entry_type -> trade_direction
    entry = result.get('entry', [])
    exit = result.get('exit', [])
    direction = result.get('direction', result.get('entry_type', result.get('trade_direction', [])))
    
    # Final validation after potential auto-fix
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

def extract_reverse_signals_flag(market_data_dict):
    """Extract reverse_signals flag from market data - Fixed version"""
    try:
        # Handle different data types safely
        if isinstance(market_data_dict, dict):
            return market_data_dict.get('reverse_signals', False)
        elif hasattr(market_data_dict, 'get'):
            return market_data_dict.get('reverse_signals', False)
        else:
            # If it's not a dict-like object, return default
            print(f"⚠️ market_data_dict is not dict-like: {type(market_data_dict)}")
            return False
    except Exception as e:
        print(f"⚠️ Error extracting reverse_signals flag: {e}")
        return False
`;
