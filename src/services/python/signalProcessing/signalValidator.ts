
export const SIGNAL_VALIDATOR_PYTHON_CODE = `
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
`;
