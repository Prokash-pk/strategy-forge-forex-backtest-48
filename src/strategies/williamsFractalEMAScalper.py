
# Williams Fractal + Triple EMA Scalper Strategy
# Exact implementation as specified - optimized for 1-minute timeframe
# Now supports signal reversal for testing opposite strategy performance

def strategy_logic(data, reverse_signals=False):
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    
    # Calculate Triple EMAs exactly as specified
    ema_20 = TechnicalAnalysis.ema(close, 20)  # Green
    ema_50 = TechnicalAnalysis.ema(close, 50)  # Yellow  
    ema_100 = TechnicalAnalysis.ema(close, 100)  # Red
    
    # Williams Fractals implementation (period = 2)
    def detect_fractals(highs, lows, period=2):
        fractal_high = []  # Red arrows (resistance)
        fractal_low = []   # Green arrows (support)
        
        for i in range(len(highs)):
            if i < period or i >= len(highs) - period:
                fractal_high.append(False)
                fractal_low.append(False)
                continue
            
            # Fractal High (Red arrow - resistance level)
            is_fractal_high = True
            for j in range(i - period, i + period + 1):
                if j != i and highs[j] >= highs[i]:
                    is_fractal_high = False
                    break
            
            # Fractal Low (Green arrow - support level)
            is_fractal_low = True
            for j in range(i - period, i + period + 1):
                if j != i and lows[j] <= lows[i]:
                    is_fractal_low = False
                    break
                    
            fractal_high.append(is_fractal_high)
            fractal_low.append(is_fractal_low)
        
        return fractal_high, fractal_low
    
    fractal_highs, fractal_lows = detect_fractals(high, low, 2)
    
    entry = []
    exit = []
    trade_type = []  # Track LONG/SHORT signals
    stop_loss_levels = []
    take_profit_levels = []
    
    for i in range(len(data)):
        if i < 105:  # Need enough data for EMA 100 + fractal lookback
            entry.append(False)
            exit.append(False)
            trade_type.append('NONE')
            stop_loss_levels.append(0)
            take_profit_levels.append(0)
            continue
        
        current_price = close[i]
        current_ema_20 = ema_20[i]
        current_ema_50 = ema_50[i]
        current_ema_100 = ema_100[i]
        
        # LONG Entry Conditions (exactly as specified)
        long_ema_order = (current_ema_20 > current_ema_50 and 
                         current_ema_50 > current_ema_100)
        
        # SHORT Entry Conditions (exactly as specified)
        short_ema_order = (current_ema_100 > current_ema_50 and 
                          current_ema_50 > current_ema_20)
        
        # Initialize signals
        long_entry = False
        short_entry = False
        current_trade_type = 'NONE'
        stop_loss = 0
        take_profit = 0
        
        # LONG ENTRY LOGIC
        if long_ema_order and current_price > current_ema_100:  # DO NOT enter if price closes below EMA 100
            # Check pullback conditions
            pullback_below_20 = current_price < current_ema_20
            pullback_below_50 = current_price < current_ema_50
            
            # Look for Williams Fractal green arrow (support) during or after pullback
            recent_fractal_low = any(fractal_lows[max(0, i-5):i+1])  # Look back 5 bars for fractal
            
            if (pullback_below_20 or pullback_below_50) and recent_fractal_low:
                long_entry = True
                current_trade_type = 'LONG'
                
                # Stop Loss logic as specified:
                if pullback_below_50:
                    # If price pulled back below EMA 50: Stop Loss below EMA 100
                    stop_loss = current_ema_100 - 0.0001  # Slightly below
                else:  # pullback_below_20
                    # If price pulled back below EMA 20: Stop Loss below EMA 50
                    stop_loss = current_ema_50 - 0.0001  # Slightly below
                
                # Take Profit: 1.5× risk (Risk-Reward Ratio 1:1.5)
                risk_distance = abs(current_price - stop_loss)
                take_profit = current_price + (1.5 * risk_distance)
        
        # SHORT ENTRY LOGIC  
        elif short_ema_order and current_price < current_ema_100:  # DO NOT enter if price closes above EMA 100
            # Check pullback condition
            pullback_above_20 = current_price > current_ema_20
            
            # Look for Williams Fractal red arrow (resistance) after pullback
            recent_fractal_high = any(fractal_highs[max(0, i-5):i+1])  # Look back 5 bars for fractal
            
            if pullback_above_20 and recent_fractal_high:
                short_entry = True
                current_trade_type = 'SHORT'
                
                # Stop Loss: Above EMA 50
                stop_loss = current_ema_50 + 0.0001  # Slightly above
                
                # Take Profit: 1.5× risk
                risk_distance = abs(current_price - stop_loss)
                take_profit = current_price - (1.5 * risk_distance)
        
        # Apply signal reversal if requested
        if reverse_signals:
            # Swap LONG and SHORT signals
            if long_entry:
                long_entry = False
                short_entry = True
                current_trade_type = 'SHORT'
                # Recalculate stop/profit for reversed SHORT signal
                stop_loss = current_ema_50 + 0.0001  # Above EMA 50 for SHORT
                risk_distance = abs(current_price - stop_loss)
                take_profit = current_price - (1.5 * risk_distance)
            elif short_entry:
                short_entry = False
                long_entry = True
                current_trade_type = 'LONG'
                # Recalculate stop/profit for reversed LONG signal
                if current_price < current_ema_50:
                    stop_loss = current_ema_100 - 0.0001  # Below EMA 100 for LONG
                else:
                    stop_loss = current_ema_50 - 0.0001  # Below EMA 50 for LONG
                risk_distance = abs(current_price - stop_loss)
                take_profit = current_price + (1.5 * risk_distance)
        
        # Final entry signal
        entry_signal = long_entry or short_entry
        
        # Exit conditions - EMA order breakdown or invalid conditions
        exit_signal = False
        
        # Check for EMA order breakdown (Invalid Conditions)
        if i > 0:
            prev_trade = trade_type[i-1] if i > 0 else 'NONE'
            
            if prev_trade == 'LONG':
                # Exit LONG if EMA order breaks or price closes below EMA 100
                ema_order_broken = not (current_ema_20 > current_ema_50 and current_ema_50 > current_ema_100)
                price_below_ema100 = current_price < current_ema_100
                if ema_order_broken or price_below_ema100:
                    exit_signal = True
                    
            elif prev_trade == 'SHORT':
                # Exit SHORT if EMA order breaks or price closes above EMA 100  
                ema_order_broken = not (current_ema_100 > current_ema_50 and current_ema_50 > current_ema_20)
                price_above_ema100 = current_price > current_ema_100
                if ema_order_broken or price_above_ema100:
                    exit_signal = True
        
        entry.append(entry_signal)
        exit.append(exit_signal)
        trade_type.append(current_trade_type)
        stop_loss_levels.append(stop_loss)
        take_profit_levels.append(take_profit)
    
    return {
        'entry': entry,
        'exit': exit,
        'ema_20': ema_20,
        'ema_50': ema_50,
        'ema_100': ema_100,
        'fractal_highs': fractal_highs,  # Red arrows
        'fractal_lows': fractal_lows,    # Green arrows
        'trade_type': trade_type,
        'stop_loss_levels': stop_loss_levels,
        'take_profit_levels': take_profit_levels,
        'reverse_signals_applied': reverse_signals
    }
