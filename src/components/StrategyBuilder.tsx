
import React from 'react';
import { useBacktest } from '@/hooks/useBacktest';
import { useStrategyBuilder } from '@/hooks/useStrategyBuilder';
import StrategyBuilderStatus from './strategy/StrategyBuilderStatus';
import StrategyBuilderLayout from './strategy/StrategyBuilderLayout';

interface StrategyBuilderProps {
  onStrategyUpdate: (strategy: any) => void;
  onBacktestComplete: (results: any) => void;
  onNavigateToResults: () => void;
  initialStrategy?: any;
}

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ 
  onStrategyUpdate, 
  onBacktestComplete, 
  onNavigateToResults,
  initialStrategy 
}) => {
  const {
    strategy,
    pythonStatus,
    handleStrategyChange,
    handleStrategySelect,
    handleBacktestComplete
  } = useStrategyBuilder(onStrategyUpdate, onBacktestComplete, onNavigateToResults, initialStrategy);

  const { isRunning, currentStep, runBacktest } = useBacktest();

  const handleRunBacktest = () => {
    runBacktest(strategy, handleBacktestComplete);
  };

  return (
    <div className="space-y-6">
      <StrategyBuilderStatus pythonStatus={pythonStatus} />
      
      <StrategyBuilderLayout
        strategy={strategy}
        onStrategyChange={handleStrategyChange}
        onRunBacktest={handleRunBacktest}
        isRunning={isRunning}
        currentStep={currentStep}
        onStrategySelect={handleStrategySelect}
      />
    </div>
  );
};

export default StrategyBuilder;
