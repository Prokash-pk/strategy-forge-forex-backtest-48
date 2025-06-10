
export const SIGNAL_PROCESSING_PYTHON_CODE = `
def validate_strategy_signals(result):
    """Validate that strategy returns proper directional signals"""
    
    if not isinstance(result, dict):
        return False, "Strategy must return a dictionary"
    
    entry = result.get('entry', [])
    exit = result.get('exit', [])
    direction = result.get('direction', result.get('entry_type', result.get('trade_direction', [])))
    
    # Check required fields exist
    if not entry:
        return False, "Strategy must return 'entry' array"
    
    if not exit:
        return False, "Strategy must return 'exit' array"
    
    # If no direction array exists, we'll auto-generate it
    if not direction:
        print("⚠️ No direction array found - will auto-generate BUY/SELL signals")
        return True, "Strategy valid - will auto-generate directional signals"
    
    # Check array lengths match
    if len(entry) != len(exit) or len(entry) != len(direction):
        return False, f"Arrays must be same length: entry({len(entry)}), exit({len(exit)}), direction({len(direction)})"
    
    # Validate direction values
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

def auto_detect_trade_direction(result, close_prices):
    """Auto-detect trade direction from strategy conditions and market context"""
    
    entry = result.get('entry', [])
    if not entry:
        return []
    
    direction = []
    
    # Try to extract strategy variables that indicate direction
    short_ema = result.get('short_ema', [])
    long_ema = result.get('long_ema', [])
    rsi = result.get('rsi', [])
    
    for i, has_entry in enumerate(entry):
        if not has_entry:
            direction.append(None)
        else:
            # Auto-detect direction based on available indicators
            detected_direction = 'BUY'  # Default to BUY
            
            # Method 1: Use EMA crossover if available
            if short_ema and long_ema and i < len(short_ema) and i < len(long_ema):
                if not math.isnan(short_ema[i]) and not math.isnan(long_ema[i]):
                    if short_ema[i] > long_ema[i]:
                        detected_direction = 'BUY'
                    else:
                        detected_direction = 'SELL'
            
            # Method 2: Use RSI if available
            elif rsi and i < len(rsi) and not math.isnan(rsi[i]):
                if rsi[i] < 50:
                    detected_direction = 'BUY'  # Oversold condition
                else:
                    detected_direction = 'SELL'  # Overbought condition
            
            # Method 3: Use price momentum if available
            elif close_prices and len(close_prices) > i and i > 5:
                # Check price momentum over last 5 periods
                recent_momentum = close_prices[i] - close_prices[i-5]
                if recent_momentum > 0:
                    detected_direction = 'BUY'
                else:
                    detected_direction = 'SELL'
            
            direction.append(detected_direction)
    
    print(f"🔧 Auto-generated {direction.count('BUY')} BUY and {direction.count('SELL')} SELL signals")
    return direction

def enforce_directional_signals(result):
    """Enforce that strategies have proper directional signals"""
    
    # First validate the existing structure
    is_valid, message = validate_strategy_signals(result)
    
    if is_valid and result.get('direction'):
        print(f"📊 {message}")
        return result
    
    print(f"🔧 Auto-generating directional signals...")
    
    # Try to auto-detect direction based on strategy logic
    entry = result.get('entry', [])
    
    if not entry:
        print("❌ Cannot fix: No entry signals found")
        return {'entry': [], 'exit': [], 'direction': [], 'error': 'No entry signals found'}
    
    # Get close prices from data if available
    close_prices = result.get('close', [])
    
    # Auto-generate direction based on strategy indicators
    direction = auto_detect_trade_direction(result, close_prices)
    
    # Update result with auto-generated signals
    result['direction'] = direction
    result['auto_generated_direction'] = True
    
    print(f"✅ Auto-generated directional signals: {direction.count('BUY')} BUY, {direction.count('SELL')} SELL")
    
    return result

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
`;
