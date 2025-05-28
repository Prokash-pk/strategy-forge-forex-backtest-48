
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <StrategyConfiguration
          strategy={strategy}
          onStrategyChange={onStrategyChange}
          onRunBacktest={onRunBacktest}
          isRunning={isRunning}
        />
        
        <StrategyHistory onStrategySelect={onStrategySelect} />
      </div>
      
      <div className="lg:col-span-1">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="text-slate-400">
              <p className="text-lg font-medium mb-2">Strategy Analysis</p>
              <p className="text-sm">Run a backtest to view detailed results and performance metrics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StrategyBuilderLayout;
