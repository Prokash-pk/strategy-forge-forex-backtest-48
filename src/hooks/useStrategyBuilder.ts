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
    code: `# Smart Momentum Strategy - Enhanced with AI Filters
# Properly integrated trend and volatility filters for better performance

def strategy_logic(data):
    """
    High-quality momentum strategy with properly integrated:
    - Multiple timeframe trend filtering
    - Volatility filtering
    - Enhanced entry/exit conditions
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
            
            # LONG entry with ALL filters applied
            long_entry = (trend_up and 
                         momentum_strong_up and 
                         rsi_good_long and
                         weekly_trend_up and  # Higher timeframe confirmation
                         high_volatility)     # Volatility filter
            
            # SHORT entry with ALL filters applied
            short_entry = (trend_down and 
                          momentum_strong_down and 
                          rsi_good_short and
                          weekly_trend_down and  # Higher timeframe confirmation
                          high_volatility)       # Volatility filter
            
            # Exit conditions - more conservative
            exit_long = (not trend_up or 
                        rsi[i] > 80 or 
                        rsi[i] < 20 or
                        not weekly_trend_up or
                        not high_volatility)
            
            exit_short = (not trend_down or 
                         rsi[i] > 80 or 
                         rsi[i] < 20 or
                         not weekly_trend_down or
                         not high_volatility)
            
            entry.append(long_entry or short_entry)
            exit.append(exit_long or exit_short)
    
    return {
        'entry': entry,
        'exit': exit,
        'short_ema': short_ema,
        'long_ema': long_ema,
        'daily_ema': daily_ema,
        'rsi': rsi,
        'atr': atr,
        'avg_atr': avg_atr
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
      
      // Check if this is a high-performing strategy worth featuring
      const isHighPerforming = (results.winRate || 0) >= 60 && 
                              (results.totalReturn || 0) > 15 && 
                              (results.totalTrades || 0) >= 10;

      if (isHighPerforming) {
        toast({
          title: "High-Performance Strategy Detected! 🎉",
          description: `Your strategy achieved ${results.winRate?.toFixed(1)}% win rate with ${results.totalReturn?.toFixed(1)}% return. It will be featured in recommendations!`,
        });
      } else {
        toast({
          title: "Backtest Complete!",
          description: `Strategy tested with ${results.totalTrades} trades. Navigating to results...`,
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
