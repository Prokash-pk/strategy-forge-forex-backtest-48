
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import StrategyConfigurationTab from '../StrategyConfigurationTab';
import PythonStrategyTab from '../PythonStrategyTab';
import SavedStrategiesTab from '../SavedStrategiesTab';
import VisualStrategyTab from '../VisualStrategyTab';
import StrategyRecommendationsTab from '../StrategyRecommendationsTab';
import HighPerformanceStrategiesTab from '../HighPerformanceStrategiesTab';
import OANDAIntegration from '../OANDAIntegration';
import MT4Integration from '../MT4Integration';
import InteractiveBrokersIntegration from '../InteractiveBrokersIntegration';

interface TabContentProps {
  strategy: any;
  onStrategyChange: (strategy: any) => void;
  onRunBacktest: () => void;
  isRunning: boolean;
  onStrategySelect: (strategy: any) => void;
  backtestResults: any;
  onAddToStrategy: (code: string) => void;
  onTestReverseStrategy: () => void;
  isReverseTestRunning: boolean;
  onNavigateToConfiguration: () => void;
}

const TabContent: React.FC<TabContentProps> = ({
  strategy,
  onStrategyChange,
  onRunBacktest,
  isRunning,
  onStrategySelect,
  backtestResults,
  onAddToStrategy,
  onTestReverseStrategy,
  isReverseTestRunning,
  onNavigateToConfiguration
}) => {
  const handleStrategyLoad = (loadedStrategy: any) => {
    onStrategySelect(loadedStrategy);
  };

  return (
    <div className="w-full">
      <TabsContent value="configuration" className="mt-0 w-full">
        <div className="w-full space-y-6">
          <StrategyConfigurationTab
            strategy={strategy}
            onStrategyChange={onStrategyChange}
            onRunBacktest={onRunBacktest}
            isRunning={isRunning}
          />
        </div>
      </TabsContent>

      <TabsContent value="python" className="mt-0 w-full">
        <div className="w-full space-y-6">
          <PythonStrategyTab
            strategy={strategy}
            onStrategyChange={onStrategyChange}
            onRunBacktest={onRunBacktest}
            isRunning={isRunning}
          />
        </div>
      </TabsContent>

      <TabsContent value="saved" className="mt-0 w-full">
        <div className="w-full space-y-6">
          <SavedStrategiesTab 
            onStrategyLoad={handleStrategyLoad}
            onNavigateToConfiguration={onNavigateToConfiguration}
          />
        </div>
      </TabsContent>

      <TabsContent value="visual" className="mt-0 w-full">
        <div className="w-full space-y-6">
          <VisualStrategyTab 
            strategy={strategy || {}}
            onStrategyChange={onStrategyChange} 
            onAddToStrategy={onAddToStrategy}
          />
        </div>
      </TabsContent>

      <TabsContent value="recommendations" className="mt-0 w-full">
        <div className="w-full space-y-6">
          <StrategyRecommendationsTab
            strategy={strategy}
            onStrategyChange={onStrategyChange}
            backtestResults={backtestResults}
            onAddToStrategy={onAddToStrategy}
            onStrategySelect={onStrategySelect}
          />
        </div>
      </TabsContent>

      <TabsContent value="mt4" className="mt-0 w-full">
        <div className="w-full space-y-6">
          <MT4Integration />
        </div>
      </TabsContent>

      <TabsContent value="oanda" className="mt-0 w-full">
        <div className="w-full space-y-6">
          <OANDAIntegration />
        </div>
      </TabsContent>

      <TabsContent value="interactive-brokers" className="mt-0 w-full">
        <div className="w-full space-y-6">
          <InteractiveBrokersIntegration />
        </div>
      </TabsContent>
    </div>
  );
};

export default TabContent;
