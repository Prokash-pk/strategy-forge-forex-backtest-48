
import { useToast } from '@/hooks/use-toast';
import { StrategyResult } from '@/services/strategyStorage';

export const useStrategyActions = (
  updateStrategy: (updates: any) => void,
  onStrategyUpdate: (strategy: any) => void
) => {
  const { toast } = useToast();

  const handleStrategyChange = (updates: any) => {
    updateStrategy(updates);
    const newStrategy = { ...updates };
    onStrategyUpdate(newStrategy);
  };

  const handleStrategySelect = (savedStrategy: StrategyResult) => {
    const strategyUpdates = {
      name: savedStrategy.strategy_name,
      code: savedStrategy.strategy_code,
      symbol: savedStrategy.symbol,
      timeframe: savedStrategy.timeframe
    };
    
    updateStrategy(strategyUpdates);
    
    toast({
      title: "Strategy Loaded",
      description: `Loaded "${savedStrategy.strategy_name}" strategy`,
    });
  };

  return {
    handleStrategyChange,
    handleStrategySelect
  };
};
