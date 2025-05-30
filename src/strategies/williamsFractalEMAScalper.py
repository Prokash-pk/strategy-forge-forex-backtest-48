
# Williams Fractal + Triple EMA Scalper Strategy
# Optimized for 1-minute timeframe but works on all timeframes

def strategy_logic(data):
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    
    # Calculate Triple EMAs
    ema_20 = TechnicalAnalysis.ema(close, 20)
    ema_50 = TechnicalAnalysis.ema(close, 50)
    ema_100 = TechnicalAnalysis.ema(close, 100)
    
    # Williams Fractals implementation
    def detect_fractals(highs, lows, period=2):
        fractal_high = []
        fractal_low = []
        
        for i in range(len(highs)):
            if i < period or i >= len(highs) - period:
                fractal_high.append(False)
                fractal_low.append(False)
                continue
            
            # Fractal High (resistance)
            is_fractal_high = True
            for j in range(i - period, i + period + 1):
                if j != i and highs[j] >= highs[i]:
                    is_fractal_high = False
                    break
            
            # Fractal Low (support)
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
    pullback_level = []
    stop_loss_level = []
    
    for i in range(len(data)):
        if i < 105:  # Need enough data for EMA 100 + fractal lookback
            entry.append(False)
            exit.append(False)
            pullback_level.append(0)
            stop_loss_level.append(0)
            continue
        
        current_price = close[i]
        current_ema_20 = ema_20[i]
        current_ema_50 = ema_50[i]
        current_ema_100 = ema_100[i]
        
        # Check EMA alignment for LONG
        long_ema_order = (current_ema_20 > current_ema_50 and 
                         current_ema_50 > current_ema_100)
        
        # Check EMA alignment for SHORT
        short_ema_order = (current_ema_100 > current_ema_50 and 
                          current_ema_50 > current_ema_20)
        
        # LONG Entry Logic
        long_entry = False
        long_stop_loss = 0
        
        if long_ema_order and current_price > current_ema_100:
            # Check for pullback conditions
            pullback_below_20 = current_price < current_ema_20
            pullback_below_50 = current_price < current_ema_50
            
            # Look for fractal signal in recent bars (within 3 bars)
            recent_fractal_low = any(fractal_lows[max(0, i-3):i+1])
            
            if (pullback_below_20 or pullback_below_50) and recent_fractal_low:
                long_entry = True
                
                # Dynamic stop loss based on pullback level
                if pullback_below_50:
                    long_stop_loss = current_ema_100
                    pullback_level.append(50)
                else:  # pullback_below_20
                    long_stop_loss = current_ema_50
                    pullback_level.append(20)
        
        # SHORT Entry Logic
        short_entry = False
        short_stop_loss = 0
        
        if short_ema_order and current_price < current_ema_100:
            # Check for pullback above EMA 20
            pullback_above_20 = current_price > current_ema_20
            
            # Look for fractal signal in recent bars
            recent_fractal_high = any(fractal_highs[max(0, i-3):i+1])
            
            if pullback_above_20 and recent_fractal_high:
                short_entry = True
                short_stop_loss = current_ema_50
                pullback_level.append(-20)  # Negative for short
        
        # Determine final entry signal
        entry_signal = long_entry or short_entry
        
        # Store stop loss level for risk calculation
        if long_entry:
            stop_loss_level.append(long_stop_loss)
        elif short_entry:
            stop_loss_level.append(short_stop_loss)
        else:
            stop_loss_level.append(0)
            if not (long_entry or short_entry):
                pullback_level.append(0)
        
        # Exit conditions
        exit_signal = False
        
        # Check if we should exit based on EMA order breakdown
        if i > 0 and entry[i-1]:  # If we entered on previous bar
            # Exit long if EMA order breaks or price closes below EMA 100
            if long_ema_order and (current_price < current_ema_100 or 
                                  not (current_ema_20 > current_ema_50 and current_ema_50 > current_ema_100)):
                exit_signal = True
            
            # Exit short if EMA order breaks or price closes above EMA 100
            elif short_ema_order and (current_price > current_ema_100 or 
                                     not (current_ema_100 > current_ema_50 and current_ema_50 > current_ema_20)):
                exit_signal = True
        
        entry.append(entry_signal)
        exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'ema_20': ema_20,
        'ema_50': ema_50,
        'ema_100': ema_100,
        'fractal_highs': fractal_highs,
        'fractal_lows': fractal_lows,
        'pullback_level': pullback_level,
        'stop_loss_level': stop_loss_level
    }
