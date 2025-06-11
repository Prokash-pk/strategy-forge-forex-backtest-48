import { useState, useEffect } from 'react';

const DEFAULT_STRATEGY = {
  name: 'Smart Momentum Strategy',
  symbol: 'EURUSD=X',
  timeframe: '5m',
  initialBalance: 10000,
  riskPerTrade: 1,
  stopLoss: 40,
  takeProfit: 80,
  spread: 2,
  commission: 0.5,
  slippage: 1,
  maxPositionSize: 100000,
  riskModel: 'percentage',
  reverseSignals: false,
  positionSizingMode: 'manual',
  riskRewardRatio: 2.0,
  code: `# Smart Momentum Strategy - OANDA Compatible with Auto-Detected BUY/SELL
# Enhanced with automatic signal direction detection for forward trading

def strategy_logic(data, reverse_signals=False):
    """
    Enhanced momentum strategy with AUTO-DETECTED directional signals:
    - Multiple timeframe trend filtering
    - Volatility filtering  
    - AUTOMATIC BUY/SELL direction detection from conditions
    - Reverse signal testing capability
    """
    
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    
    # Calculate all technical indicators
    short_ema = TechnicalAnalysis.ema(close, 21)
    long_ema = TechnicalAnalysis.ema(close, 55)
    daily_ema = TechnicalAnalysis.ema(close, 200)  # Higher timeframe trend
    rsi = TechnicalAnalysis.rsi(close, 14)
    
    # Volatility filter using ATR
    atr = TechnicalAnalysis.atr(high, low, close, 14)
    avg_atr = TechnicalAnalysis.sma(atr, 20)
    
    entry = []
    exit = []
    direction = []  # CRITICAL: Auto-detected trade direction for OANDA
    
    for i in range(len(close)):
        if i < 200:  # Need enough data for all indicators
            entry.append(False)
            exit.append(False)
            direction.append(None)
        else:
            # Higher timeframe trend filter
            weekly_trend_up = close[i] > daily_ema[i]
            weekly_trend_down = close[i] < daily_ema[i]
            
            # Volatility filter - only trade during high volatility
            high_volatility = atr[i] > avg_atr[i] * 1.2 if not math.isnan(atr[i]) and not math.isnan(avg_atr[i]) else False
            
            # Enhanced momentum conditions
            trend_up = short_ema[i] > long_ema[i] and short_ema[i-1] > short_ema[i-5]
            trend_down = short_ema[i] < long_ema[i] and short_ema[i-1] < short_ema[i-5]
            momentum_strong_up = close[i] > short_ema[i] * 1.001
            momentum_strong_down = close[i] < short_ema[i] * 0.999
            rsi_good_long = 45 < rsi[i] < 75
            rsi_good_short = 25 < rsi[i] < 55
            
            # AUTO-DETECT BUY CONDITIONS
            base_long_entry = (trend_up and 
                              momentum_strong_up and 
                              rsi_good_long and
                              weekly_trend_up and
                              high_volatility)
            
            # AUTO-DETECT SELL CONDITIONS  
            base_short_entry = (trend_down and 
                               momentum_strong_down and 
                               rsi_good_short and
                               weekly_trend_down and
                               high_volatility)
            
            # Apply reverse signals if enabled (for testing opposite direction)
            if reverse_signals:
                actual_long = base_short_entry   # Reverse: use short conditions for BUY
                actual_short = base_long_entry   # Reverse: use long conditions for SELL
            else:
                actual_long = base_long_entry    # Normal: use long conditions for BUY
                actual_short = base_short_entry  # Normal: use short conditions for SELL
            
            # AUTO-GENERATE DIRECTIONAL SIGNALS for OANDA
            if actual_long:
                entry.append(True)
                direction.append("BUY")  # AUTO-DETECTED BUY signal
            elif actual_short:
                entry.append(True) 
                direction.append("SELL")  # AUTO-DETECTED SELL signal
            else:
                entry.append(False)
                direction.append(None)  # No trade signal
            
            # Conservative exit conditions
            exit_signal = (rsi[i] > 80 or rsi[i] < 20 or not high_volatility)
            exit.append(exit_signal)
    
    # CRITICAL: Return direction array for OANDA auto trading
    return {
        'entry': entry,
        'exit': exit,
        'direction': direction,  # AUTO-DETECTED BUY/SELL directions
        'short_ema': short_ema,
        'long_ema': long_ema,
        'daily_ema': daily_ema,
        'rsi': rsi,
        'atr': atr,
        'avg_atr': avg_atr,
        'reverse_signals_applied': reverse_signals,
        'note': 'Strategy with AUTO-DETECTED BUY/SELL directions for OANDA forward trading'
    }`
};

export const useStrategyState = (initialStrategy?: any) => {
  const [strategy, setStrategy] = useState(DEFAULT_STRATEGY);

  // Update strategy when initialStrategy changes
  useEffect(() => {
    if (initialStrategy) {
      setStrategy(prev => ({ ...prev, ...initialStrategy }));
    }
  }, [initialStrategy]);

  const updateStrategy = (updates: any) => {
    setStrategy(prev => ({ ...prev, ...updates }));
  };

  return {
    strategy,
    updateStrategy
  };
};
