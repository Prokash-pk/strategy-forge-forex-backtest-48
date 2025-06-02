
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Code2, Bookmark, Lightbulb, TrendingUp, Cpu } from 'lucide-react';
import StrategyConfigurationTab from './StrategyConfigurationTab';
import PythonStrategyTab from './PythonStrategyTab';
import SavedStrategiesTab from './SavedStrategiesTab';
import VisualStrategyTab from './VisualStrategyTab';
import StrategyRecommendationsTab from './StrategyRecommendationsTab';
import HighPerformanceStrategiesTab from './HighPerformanceStrategiesTab';
import OANDAIntegration from './OANDAIntegration';

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
  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8">
      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-slate-800 border-slate-700 h-auto p-1">
          <TabsTrigger 
            value="configuration" 
            className="data-[state=active]:bg-emerald-600 flex flex-col items-center gap-1 py-3 px-2 text-xs lg:text-sm"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configuration</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="python" 
            className="data-[state=active]:bg-emerald-600 flex flex-col items-center gap-1 py-3 px-2 text-xs lg:text-sm"
          >
            <Code2 className="h-4 w-4" />
            <span className="hidden sm:inline">Python Code</span>
            <span className="sm:hidden">Code</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="saved" 
            className="data-[state=active]:bg-emerald-600 flex flex-col items-center gap-1 py-3 px-2 text-xs lg:text-sm"
          >
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">Saved Strategies</span>
            <span className="sm:hidden">Saved</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="visual" 
            className="data-[state=active]:bg-emerald-600 flex flex-col items-center gap-1 py-3 px-2 text-xs lg:text-sm"
          >
            <Cpu className="h-4 w-4" />
            <span className="hidden sm:inline">Visual Builder</span>
            <span className="sm:hidden">Visual</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="recommendations" 
            className="data-[state=active]:bg-emerald-600 flex flex-col items-center gap-1 py-3 px-2 text-xs lg:text-sm"
          >
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">AI Recommendations</span>
            <span className="sm:hidden">AI</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="oanda" 
            className="data-[state=active]:bg-emerald-600 flex flex-col items-center gap-1 py-3 px-2 text-xs lg:text-sm"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">OANDA Trading</span>
            <span className="sm:hidden">OANDA</span>
          </TabsTrigger>
        </TabsList>

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
              <SavedStrategiesTab />
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

          <TabsContent value="oanda" className="mt-0 w-full">
            <div className="w-full space-y-6">
              <OANDAIntegration
                selectedStrategy={strategy}
                onStrategyUpdate={onStrategyChange}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default StrategyBuilderLayout;
