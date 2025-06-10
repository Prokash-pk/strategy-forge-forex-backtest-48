
import { useBacktestUsage } from '@/hooks/useBacktestUsage';
import { useStrategyState } from './strategy/useStrategyState';
import { usePythonStatus } from './strategy/usePythonStatus';
import { useStrategyActions } from './strategy/useStrategyActions';
import { useBacktestActions } from './strategy/useBacktestActions';

export const useStrategyBuilder = (
  onStrategyUpdate: (strategy: any) => void,
  onBacktestComplete: (results: any) => void,
  onNavigateToResults: () => void,
  initialStrategy?: any
) => {
  const { strategy, updateStrategy } = useStrategyState(initialStrategy);
  const { pythonStatus, forceRefresh } = usePythonStatus();
  const { checkCanRunBacktest } = useBacktestUsage();
  
  const { handleStrategyChange, handleStrategySelect } = useStrategyActions(
    updateStrategy,
    onStrategyUpdate
  );
  
  const { handleBacktestComplete } = useBacktestActions(
    strategy,
    onBacktestComplete,
    onNavigateToResults
  );

  return {
    strategy,
    pythonStatus,
    handleStrategyChange,
    handleStrategySelect,
    handleBacktestComplete,
    checkCanRunBacktest
  };
};
