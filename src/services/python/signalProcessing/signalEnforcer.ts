
export const SIGNAL_ENFORCER_PYTHON_CODE = `
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
`;
