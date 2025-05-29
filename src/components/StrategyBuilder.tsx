
import React from 'react';
import { useBacktest } from '@/hooks/useBacktest';
import { useStrategyBuilder } from '@/hooks/useStrategyBuilder';
import { useBacktestUsage } from '@/hooks/useBacktestUsage';
import StrategyBuilderStatus from './strategy/StrategyBuilderStatus';
import StrategyBuilderLayout from './strategy/StrategyBuilderLayout';

interface StrategyBuilderProps {
  onStrategyUpdate: (strategy: any) => void;
  onBacktestComplete: (results: any) => void;
  onNavigateToResults: () => void;
  initialStrategy?: any;
  backtestResults?: any;
}

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ 
  onStrategyUpdate, 
  onBacktestComplete, 
  onNavigateToResults,
  initialStrategy,
  backtestResults 
}) => {
  const {
    strategy,
    pythonStatus,
    handleStrategyChange,
    handleStrategySelect,
    handleBacktestComplete,
    checkCanRunBacktest
  } = useStrategyBuilder(onStrategyUpdate, onBacktestComplete, onNavigateToResults, initialStrategy);

  const { isRunning, currentStep, runBacktest } = useBacktest();
  const { backtestCount, limit, canRunBacktest } = useBacktestUsage();

  const handleRunBacktest = () => {
    if (!checkCanRunBacktest()) {
      return;
    }
    runBacktest(strategy, handleBacktestComplete);
  };

  const handleAddToStrategy = (codeSnippet: string) => {
    const updatedCode = strategy.code + '\n\n' + codeSnippet;
    handleStrategyChange({ code: updatedCode });
  };

  return (
    <div className="space-y-6">
      <StrategyBuilderStatus 
        pythonStatus={pythonStatus} 
        backtestUsage={{ count: backtestCount, limit, canRun: canRunBacktest }}
      />
      
      <StrategyBuilderLayout
        strategy={strategy}
        onStrategyChange={handleStrategyChange}
        onRunBacktest={handleRunBacktest}
        isRunning={isRunning}
        currentStep={currentStep}
        onStrategySelect={handleStrategySelect}
        backtestResults={backtestResults}
        onAddToStrategy={handleAddToStrategy}
      />
    </div>
  );
};

export default StrategyBuilder;
