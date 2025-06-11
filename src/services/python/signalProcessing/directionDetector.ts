
export const DIRECTION_DETECTOR_PYTHON_CODE = `
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
`;
