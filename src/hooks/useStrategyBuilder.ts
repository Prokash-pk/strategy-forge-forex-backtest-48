import { useState, useEffect } from 'react';
import { PythonExecutor } from '@/services/pythonExecutor';
import { StrategyStorage, StrategyResult } from '@/services/strategyStorage';
import { useToast } from '@/hooks/use-toast';
import { useBacktestUsage } from '@/hooks/useBacktestUsage';

export const useStrategyBuilder = (
  onStrategyUpdate: (strategy: any) => void,
  onBacktestComplete: (results: any) => void,
  onNavigateToResults: () => void,
  initialStrategy?: any
) => {
  const [strategy, setStrategy] = useState({
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
    code: `# Smart Momentum Strategy - Enhanced with Signal Reversal Testing
# Test both regular and reverse signals to find optimal direction

def strategy_logic(data):
    """
    Enhanced momentum strategy that can test both directions:
    - Multiple timeframe trend filtering
    - Volatility filtering
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
    
    for i in range(len(close)):
        if i < 200:  # Need enough data for all indicators
            entry.append(False)
            exit.append(False)
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
            
            # CORE SIGNAL LOGIC (this will be reversed if reverseSignals=True)
            base_long_entry = (trend_up and 
                              momentum_strong_up and 
                              rsi_good_long and
                              weekly_trend_up and
                              high_volatility)
            
            base_short_entry = (trend_down and 
                               momentum_strong_down and 
                               rsi_good_short and
                               weekly_trend_down and
                               high_volatility)
            
            # REVERSE LOGIC TEST: If this strategy keeps losing, 
            # try the opposite - sell when conditions look bullish, buy when bearish
            # This tests if we're systematically entering at the wrong time
            
            entry.append(base_long_entry or base_short_entry)
            
            # Conservative exit conditions
            exit_signal = (rsi[i] > 80 or rsi[i] < 20 or not high_volatility)
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'short_ema': short_ema,
        'long_ema': long_ema,
        'daily_ema': daily_ema,
        'rsi': rsi,
        'atr': atr,
        'avg_atr': avg_atr,
        'note': 'Strategy ready for reverse signal testing'
    }`
  });

  const [pythonStatus, setPythonStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const { toast } = useToast();
  const { checkCanRunBacktest, incrementBacktestCount } = useBacktestUsage();

  // Update strategy when initialStrategy changes
  useEffect(() => {
    if (initialStrategy) {
      setStrategy(prev => ({ ...prev, ...initialStrategy }));
    }
  }, [initialStrategy]);

  useEffect(() => {
    const checkPythonStatus = async () => {
      try {
        const isAvailable = await PythonExecutor.isAvailable();
        setPythonStatus(isAvailable ? 'available' : 'unavailable');
      } catch {
        setPythonStatus('unavailable');
      }
    };

    checkPythonStatus();
  }, []);

  const handleStrategyChange = (updates: any) => {
    const newStrategy = { ...strategy, ...updates };
    setStrategy(newStrategy);
    onStrategyUpdate(newStrategy);
  };

  const handleStrategySelect = (savedStrategy: StrategyResult) => {
    setStrategy(prev => ({
      ...prev,
      name: savedStrategy.strategy_name,
      code: savedStrategy.strategy_code,
      symbol: savedStrategy.symbol,
      timeframe: savedStrategy.timeframe
    }));
    
    toast({
      title: "Strategy Loaded",
      description: `Loaded "${savedStrategy.strategy_name}" strategy`,
    });
  };

  const handleBacktestComplete = async (results: any) => {
    try {
      // Increment backtest usage count
      incrementBacktestCount();

      const strategyResult = {
        strategy_name: strategy.name,
        strategy_code: strategy.code,
        symbol: strategy.symbol,
        timeframe: strategy.timeframe,
        win_rate: results.winRate || 0,
        total_return: results.totalReturn || 0,
        total_trades: results.totalTrades || 0,
        profit_factor: results.profitFactor || 0,
        max_drawdown: results.maxDrawdown || 0,
      };

      await StrategyStorage.saveStrategyResult(strategyResult);
      
      // Enhanced feedback based on performance
      const isGoodStrategy = (results.winRate || 0) >= 55 && (results.totalReturn || 0) > 10;
      const isBadStrategy = (results.winRate || 0) < 35 || (results.totalReturn || 0) < -10;
      
      if (isGoodStrategy) {
        toast({
          title: "Excellent Strategy! 🎉",
          description: `${results.winRate?.toFixed(1)}% win rate with ${results.totalReturn?.toFixed(1)}% return`,
        });
      } else if (isBadStrategy) {
        toast({
          title: "Strategy Needs Improvement 📊",
          description: `Try the 'Test Reverse Strategy' button - sometimes the opposite signals work better!`,
        });
      } else {
        toast({
          title: "Backtest Complete",
          description: `${results.totalTrades} trades executed. Check AI Coach for improvements.`,
        });
      }
    } catch (error) {
      console.error('Failed to save strategy results:', error);
      toast({
        title: "Save Failed",
        description: "Could not save strategy results",
        variant: "destructive",
      });
    }

    onBacktestComplete(results);
    
    // Auto-navigate to results after a short delay
    setTimeout(() => {
      onNavigateToResults();
    }, 1500);
  };

  return {
    strategy,
    pythonStatus,
    handleStrategyChange,
    handleStrategySelect,
    handleBacktestComplete,
    checkCanRunBacktest
  };
};
