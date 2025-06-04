
export const SIGNAL_PROCESSING_PYTHON_CODE = `
def process_strategy_signals(result, reverse_signals):
    """Process and validate strategy signals for forward testing"""
    
    # Ensure we have the basic required signals
    if not isinstance(result, dict):
        return {'entry': [], 'exit': [], 'trade_direction': [], 'error': 'Invalid strategy result format'}
    
    # Extract signals with fallbacks
    entry = result.get('entry', [])
    exit = result.get('exit', [])
    trade_direction = result.get('trade_direction', [])
    
    # If trade_direction is missing, try to infer from entry signals
    if not trade_direction and entry:
        print("⚠️ Strategy missing trade_direction - attempting to infer from signals")
        trade_direction = []
        for i, has_entry in enumerate(entry):
            if has_entry:
                # Default to BUY if no direction specified
                trade_direction.append('BUY' if not reverse_signals else 'SELL')
            else:
                trade_direction.append('NONE')
    
    # Validate trade_direction contains proper BUY/SELL signals
    valid_directions = ['BUY', 'SELL', 'NONE']
    if trade_direction:
        buy_count = trade_direction.count('BUY')
        sell_count = trade_direction.count('SELL')
        total_signals = buy_count + sell_count
        
        print(f"📊 Signal Analysis: {buy_count} BUY signals, {sell_count} SELL signals, {total_signals} total")
        
        if total_signals == 0:
            print("⚠️ No BUY/SELL signals detected - strategy may not be generating trades")
        else:
            print(f"✅ Strategy generates proper directional signals")
    
    # Convert to JavaScript-compatible format
    processed_result = {
        'entry': [bool(x) for x in entry] if entry else [],
        'exit': [bool(x) for x in exit] if exit else [],
        'trade_direction': [str(x) for x in trade_direction] if trade_direction else [],
        'reverse_signals_applied': reverse_signals,
        'signal_stats': {
            'total_entries': sum(entry) if entry else 0,
            'buy_signals': trade_direction.count('BUY') if trade_direction else 0,
            'sell_signals': trade_direction.count('SELL') if trade_direction else 0
        }
    }
    
    # Include other indicators if present
    for key, value in result.items():
        if key not in ['entry', 'exit', 'trade_direction']:
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
