
import React from 'react';
import { Tabs } from '@/components/ui/tabs';
import TabsList from './layout/TabsList';
import TabContent from './layout/TabContent';

interface StrategyBuilderLayoutProps {
  strategy: any;
  onStrategyChange: (strategy: any) => void;
  onRunBacktest: () => void;
  isRunning: boolean;
  currentStep: string;
  onStrategySelect: (strategy: any) => void;
  backtestResults: any;
  onAddToStrategy: (code: string) => void;
  onTestReverseStrategy: () => void;
  isReverseTestRunning: boolean;
}

const StrategyBuilderLayout: React.FC<StrategyBuilderLayoutProps> = ({
  strategy,
  onStrategyChange,
  onRunBacktest,
  isRunning,
  currentStep,
  onStrategySelect,
  backtestResults,
  onAddToStrategy,
  onTestReverseStrategy,
  isReverseTestRunning
}) => {
  const handleNavigateToConfiguration = () => {
    // This could trigger a tab change or scroll to configuration
    console.log('Navigate to configuration');
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8">
      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList />
        
        <TabContent
          strategy={strategy}
          onStrategyChange={onStrategyChange}
          onRunBacktest={onRunBacktest}
          isRunning={isRunning}
          onStrategySelect={onStrategySelect}
          backtestResults={backtestResults}
          onAddToStrategy={onAddToStrategy}
          onTestReverseStrategy={onTestReverseStrategy}
          isReverseTestRunning={isReverseTestRunning}
          onNavigateToConfiguration={handleNavigateToConfiguration}
        />
      </Tabs>
    </div>
  );
};

export default StrategyBuilderLayout;
