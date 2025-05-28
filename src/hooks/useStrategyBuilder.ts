
import { useState, useEffect } from 'react';
import { PythonExecutor } from '@/services/pythonExecutor';
import { StrategyStorage, StrategyResult } from '@/services/strategyStorage';
import { useToast } from '@/hooks/use-toast';

export const useStrategyBuilder = (
  onStrategyUpdate: (strategy: any) => void,
  onBacktestComplete: (results: any) => void,
  onNavigateToResults: () => void
) => {
  const [strategy, setStrategy] = useState({
    name: 'EMA Crossover Strategy',
    symbol: 'EURUSD=X',
    timeframe: '5m',
    initialBalance: 10000,
    riskPerTrade: 1,
    stopLoss: 50,
    takeProfit: 100,
    spread: 2,
    commission: 0.5,
    slippage: 1,
    maxPositionSize: 100000,
    riskModel: 'fixed',
    code: `# EMA Crossover Strategy
# This strategy uses exponential moving averages for entry and exit signals

def strategy_logic(data):
    # Calculate EMAs using the TechnicalAnalysis helper
    short_ema = TechnicalAnalysis.ema(data['Close'].tolist(), 12)
    long_ema = TechnicalAnalysis.ema(data['Close'].tolist(), 26)
    
    # Entry signal: short EMA crosses above long EMA
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i == 0:
            entry.append(False)
            exit.append(False)
        else:
            # Entry: short EMA crosses above long EMA
            entry_signal = short_ema[i] > long_ema[i] and short_ema[i-1] <= long_ema[i-1]
            # Exit: short EMA crosses below long EMA
            exit_signal = short_ema[i] < long_ema[i] and short_ema[i-1] >= long_ema[i-1]
            
            entry.append(entry_signal)
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'short_ema': short_ema,
        'long_ema': long_ema
    }

# Alternative: RSI Strategy
# def strategy_logic(data):
#     rsi = TechnicalAnalysis.rsi(data['Close'].tolist(), 14)
#     entry = [rsi[i] < 30 for i in range(len(rsi))]  # Oversold
#     exit = [rsi[i] > 70 for i in range(len(rsi))]   # Overbought
#     return {'entry': entry, 'exit': exit, 'rsi': rsi}`
  });

  const [pythonStatus, setPythonStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const { toast } = useToast();

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
    setStrategy(prev => ({ ...prev, ...updates }));
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
      
      toast({
        title: "Backtest Complete!",
        description: `Strategy tested with ${results.totalTrades} trades. Navigating to results...`,
      });
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
    handleBacktestComplete
  };
};
