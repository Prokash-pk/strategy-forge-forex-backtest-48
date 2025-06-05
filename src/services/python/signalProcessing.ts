
export const SIGNAL_PROCESSING_PYTHON_CODE = `
def validate_strategy_signals(result):
    """Validate that strategy returns proper directional signals"""
    
    if not isinstance(result, dict):
        return False, "Strategy must return a dictionary"
    
    entry = result.get('entry', [])
    exit = result.get('exit', [])
    entry_type = result.get('entry_type', result.get('trade_direction', []))
    
    # Check required fields exist
    if not entry:
        return False, "Strategy must return 'entry' array"
    
    if not exit:
        return False, "Strategy must return 'exit' array"
    
    if not entry_type:
        return False, "Strategy must return 'entry_type' or 'trade_direction' array with BUY/SELL signals"
    
    # Check array lengths match
    if len(entry) != len(exit) or len(entry) != len(entry_type):
        return False, f"Arrays must be same length: entry({len(entry)}), exit({len(exit)}), entry_type({len(entry_type)})"
    
    # Validate entry_type values
    valid_directions = ['BUY', 'SELL', 'NONE', None]
    invalid_directions = [d for d in entry_type if d not in valid_directions]
    if invalid_directions:
        return False, f"Invalid entry_type values: {set(invalid_directions)}. Must be 'BUY', 'SELL', or 'NONE'"
    
    # Check for actual trading signals
    buy_signals = sum(1 for i, (has_entry, direction) in enumerate(zip(entry, entry_type)) 
                     if has_entry and direction == 'BUY')
    sell_signals = sum(1 for i, (has_entry, direction) in enumerate(zip(entry, entry_type)) 
                      if has_entry and direction == 'SELL')
    
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
        return {'entry': [], 'exit': [], 'entry_type': [], 'error': message}
    
    # Auto-generate entry_type based on simple momentum
    entry_type = []
    close_prices = result.get('close', [])
    
    for i, has_entry in enumerate(entry):
        if not has_entry:
            entry_type.append('NONE')
        else:
            # Simple heuristic: if we have price data, use momentum
            if close_prices and len(close_prices) > i and i > 0:
                if close_prices[i] > close_prices[i-1]:
                    entry_type.append('BUY')
                else:
                    entry_type.append('SELL')
            else:
                # Default to BUY if no price context
                entry_type.append('BUY')
    
    # Update result with auto-generated signals
    result['entry_type'] = entry_type
    result['auto_fixed'] = True
    result['original_error'] = message
    
    print(f"🔧 Auto-fixed strategy with {entry_type.count('BUY')} BUY and {entry_type.count('SELL')} SELL signals")
    
    return result

def process_strategy_signals(result, reverse_signals):
    """Process and validate strategy signals with enforced directional structure"""
    
    # Ensure we have the basic required signals
    if not isinstance(result, dict):
        return {'entry': [], 'exit': [], 'entry_type': [], 'error': 'Invalid strategy result format'}
    
    # Enforce directional signals (this will auto-fix if possible)
    result = enforce_directional_signals(result)
    
    # Extract signals with fallbacks
    entry = result.get('entry', [])
    exit = result.get('exit', [])
    entry_type = result.get('entry_type', result.get('trade_direction', []))
    
    # Final validation after potential auto-fix
    is_valid, validation_message = validate_strategy_signals(result)
    
    if not is_valid:
        print(f"❌ Final validation failed: {validation_message}")
        return {
            'entry': [], 
            'exit': [], 
            'entry_type': [], 
            'error': f"Strategy validation failed: {validation_message}"
        }
    
    # Apply reverse signals if requested
    if reverse_signals and entry_type:
        print("🔄 Applying reverse signals transformation")
        reversed_entry_type = []
        for direction in entry_type:
            if direction == 'BUY':
                reversed_entry_type.append('SELL')
            elif direction == 'SELL':
                reversed_entry_type.append('BUY')
            else:
                reversed_entry_type.append(direction)
        entry_type = reversed_entry_type
    
    # Convert to JavaScript-compatible format
    processed_result = {
        'entry': [bool(x) for x in entry] if entry else [],
        'exit': [bool(x) for x in exit] if exit else [],
        'entry_type': [str(x) if x is not None else 'NONE' for x in entry_type] if entry_type else [],
        'reverse_signals_applied': reverse_signals,
        'validation_passed': True,
        'validation_message': validation_message,
        'signal_stats': {
            'total_entries': sum(entry) if entry else 0,
            'buy_signals': entry_type.count('BUY') if entry_type else 0,
            'sell_signals': entry_type.count('SELL') if entry_type else 0
        }
    }
    
    # Include other indicators if present
    for key, value in result.items():
        if key not in ['entry', 'exit', 'entry_type', 'trade_direction']:
            if hasattr(value, '__iter__') and not isinstance(value, str):
                try:
                    processed_result[key] = [float(x) if not math.isnan(x) else 0 for x in value]
                except (TypeError, ValueError):
                    processed_result[key] = value
            else:
                processed_result[key] = value
    
    return processed_result

def extract_reverse_signals_flag(market_data_dict):
    """Extract reverse_signals flag from market data"""
    return market_data_dict.get('reverse_signals', False)
`;
