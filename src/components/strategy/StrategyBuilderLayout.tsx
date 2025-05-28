
import React from 'react';
import StrategyConfiguration from './StrategyConfiguration';
import RiskManagement from './RiskManagement';
import ExecutionSettings from './ExecutionSettings';
import BacktestProgress from './BacktestProgress';
import StrategyHistory from './StrategyHistory';
import { StrategyResult } from '@/services/strategyStorage';

interface StrategyBuilderLayoutProps {
  strategy: any;
  onStrategyChange: (updates: any) => void;
  onRunBacktest: () => void;
  isRunning: boolean;
  currentStep: string;
  onStrategySelect: (savedStrategy: StrategyResult) => void;
}

const StrategyBuilderLayout: React.FC<StrategyBuilderLayoutProps> = ({
  strategy,
  onStrategyChange,
  onRunBacktest,
  isRunning,
  currentStep,
  onStrategySelect
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Strategy Configuration */}
      <div className="lg:col-span-2 space-y-6">
        <StrategyConfiguration 
          strategy={strategy} 
          onStrategyChange={onStrategyChange}
          onRunBacktest={onRunBacktest}
          isRunning={isRunning}
        />
      </div>

      {/* Risk Management & Execution */}
      <div className="space-y-6">
        <RiskManagement 
          strategy={strategy} 
          onStrategyChange={onStrategyChange} 
        />
        
        <ExecutionSettings 
          strategy={strategy} 
          onStrategyChange={onStrategyChange}
          onRunBacktest={onRunBacktest}
          isRunning={isRunning}
        />
        
        <BacktestProgress currentStep={currentStep} />
        
        <StrategyHistory onStrategySelect={onStrategySelect} />
      </div>
    </div>
  );
};

export default StrategyBuilderLayout;
