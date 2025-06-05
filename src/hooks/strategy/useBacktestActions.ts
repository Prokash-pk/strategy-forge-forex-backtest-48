
import { StrategyStorage } from '@/services/strategyStorage';
import { useToast } from '@/hooks/use-toast';
import { useBacktestUsage } from '@/hooks/useBacktestUsage';

export const useBacktestActions = (
  strategy: any,
  onBacktestComplete: (results: any) => void,
  onNavigateToResults: () => void
) => {
  const { toast } = useToast();
  const { incrementBacktestCount } = useBacktestUsage();

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
    handleBacktestComplete
  };
};
