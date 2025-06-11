
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
  code: `# Smart Momentum Strategy - WORKING VERSION
# Simple EMA crossover with RSI filter that generates consistent signals

def strategy_logic(data, reverse_signals=False):
    """
    Proven momentum strategy that generates reliable signals:
    - EMA crossover for trend direction
    - RSI filter to avoid extreme conditions
    - Simple and effective approach
    """
    
    close = data['Close'].tolist()
    
    # Calculate indicators with proven parameters
    short_ema = TechnicalAnalysis.ema(close, 12)
    long_ema = TechnicalAnalysis.ema(close, 26)
    rsi = TechnicalAnalysis.rsi(close, 14)
    
    entry = []
    exit = []
    direction = []
    
    for i in range(len(close)):
        if i < 26:  # Wait for indicators to be valid
            entry.append(False)
            exit.append(False)
            direction.append(None)
        else:
            # Simple crossover signals
            bullish_crossover = short_ema[i] > long_ema[i] and short_ema[i-1] <= long_ema[i-1]
            bearish_crossover = short_ema[i] < long_ema[i] and short_ema[i-1] >= long_ema[i-1]
            
            # RSI filter - avoid extreme overbought/oversold
            rsi_not_overbought = rsi[i] < 75
            rsi_not_oversold = rsi[i] > 25
            
            # Generate entry signals
            base_long_signal = bullish_crossover and rsi_not_overbought
            base_short_signal = bearish_crossover and rsi_not_oversold
            
            # Apply reverse signals if enabled
            if reverse_signals:
                actual_long = base_short_signal
                actual_short = base_long_signal
            else:
                actual_long = base_long_signal
                actual_short = base_short_signal
            
            # Set signals
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
            exit_signal = (rsi[i] > 80 or rsi[i] < 20)
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'direction': direction,
        'short_ema': short_ema,
        'long_ema': long_ema,
        'rsi': rsi,
        'reverse_signals_applied': reverse_signals,
        'note': 'Working EMA crossover strategy with RSI filter'
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
