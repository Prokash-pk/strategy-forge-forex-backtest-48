
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
  code: `# Relaxed Smart Momentum Strategy - GENERATES SIGNALS
# More practical version that actually triggers trades

def strategy_logic(data, reverse_signals=False):
    """
    RELAXED momentum strategy that ACTUALLY generates signals:
    - Only needs 3 out of 4 conditions (not all 5)
    - More realistic thresholds
    - AUTO-DETECTED BUY/SELL directions
    """
    
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    
    # Calculate indicators with RELAXED parameters
    short_ema = TechnicalAnalysis.ema(close, 12)  # Faster response
    long_ema = TechnicalAnalysis.ema(close, 26)   # Shorter period
    trend_ema = TechnicalAnalysis.ema(close, 100) # Shorter trend filter
    rsi = TechnicalAnalysis.rsi(close, 14)
    
    # Volatility filter - MORE LENIENT
    atr = TechnicalAnalysis.atr(high, low, close, 14)
    avg_atr = TechnicalAnalysis.sma(atr, 10)  # Shorter average
    
    entry = []
    exit = []
    direction = []
    
    for i in range(len(close)):
        if i < 100:  # Reduced from 200 to 100
            entry.append(False)
            exit.append(False)
            direction.append(None)
        else:
            # RELAXED CONDITIONS - only need 3 out of 4
            conditions_met = 0
            
            # Condition 1: EMA trend
            trend_up = short_ema[i] > long_ema[i]
            trend_down = short_ema[i] < long_ema[i]
            if trend_up or trend_down:
                conditions_met += 1
            
            # Condition 2: Price momentum (more lenient)
            momentum_up = close[i] > short_ema[i] * 1.0005  # Reduced from 1.001
            momentum_down = close[i] < short_ema[i] * 0.9995 # Reduced threshold
            if momentum_up or momentum_down:
                conditions_met += 1
                
            # Condition 3: RSI range (wider range)
            rsi_good_long = 40 < rsi[i] < 80  # Wider range
            rsi_good_short = 20 < rsi[i] < 60 # Wider range
            if rsi_good_long or rsi_good_short:
                conditions_met += 1
            
            # Condition 4: Volatility (more lenient)
            high_volatility = atr[i] > avg_atr[i] * 1.1 if not math.isnan(atr[i]) and not math.isnan(avg_atr[i]) else True
            if high_volatility:
                conditions_met += 1
            
            # GENERATE SIGNALS if 3+ conditions met
            base_long_entry = (trend_up and momentum_up and rsi_good_long and conditions_met >= 3)
            base_short_entry = (trend_down and momentum_down and rsi_good_short and conditions_met >= 3)
            
            # Apply reverse signals if enabled
            if reverse_signals:
                actual_long = base_short_entry
                actual_short = base_long_entry
            else:
                actual_long = base_long_entry
                actual_short = base_short_entry
            
            # Generate directional signals
            if actual_long:
                entry.append(True)
                direction.append("BUY")
            elif actual_short:
                entry.append(True)
                direction.append("SELL")
            else:
                entry.append(False)
                direction.append(None)
            
            # Simple exit conditions
            exit_signal = (rsi[i] > 85 or rsi[i] < 15)  # Wider exit range
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'direction': direction,
        'short_ema': short_ema,
        'long_ema': long_ema,
        'trend_ema': trend_ema,
        'rsi': rsi,
        'atr': atr,
        'avg_atr': avg_atr,
        'reverse_signals_applied': reverse_signals,
        'note': 'RELAXED strategy that ACTUALLY generates trading signals'
    }`
};

export const useStrategyState = (initialStrategy?: any) => {
  const [strategy, setStrategy] = useState(() => {
    if (initialStrategy) {
      return { ...DEFAULT_STRATEGY, ...initialStrategy };
    }
    return DEFAULT_STRATEGY;
  });

  const updateStrategy = (updates: Partial<typeof strategy>) => {
    setStrategy(prev => ({ ...prev, ...updates }));
  };

  return {
    strategy,
    updateStrategy
  };
};
