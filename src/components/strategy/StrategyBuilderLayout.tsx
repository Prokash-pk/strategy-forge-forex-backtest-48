
import React from 'react';
import StrategyConfiguration from './StrategyConfiguration';
import StrategyHistory from './StrategyHistory';

interface StrategyBuilderLayoutProps {
  strategy: any;
  onStrategyChange: (updates: any) => void;
  onRunBacktest: () => void;
  isRunning: boolean;
  currentStep: string;
  onStrategySelect: (strategy: any) => void;
  backtestResults?: any;
  onAddToStrategy?: (codeSnippet: string) => void;
}

const StrategyBuilderLayout: React.FC<StrategyBuilderLayoutProps> = ({
  strategy,
  onStrategyChange,
  onRunBacktest,
  isRunning,
  currentStep,
  onStrategySelect,
  backtestResults,
  onAddToStrategy
}) => {
  return (
    <div className="space-y-6">
      <StrategyConfiguration
        strategy={strategy}
        onStrategyChange={onStrategyChange}
        onRunBacktest={onRunBacktest}
        isRunning={isRunning}
      />
      
      <StrategyHistory onStrategySelect={onStrategySelect} />
    </div>
  );
};

export default StrategyBuilderLayout;
