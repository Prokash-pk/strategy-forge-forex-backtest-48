import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Code, Settings, Eye, Languages } from 'lucide-react';
import StrategyConfiguration from './StrategyConfiguration';
import PythonStrategyTab from './PythonStrategyTab';
import VisualStrategyTab from './VisualStrategyTab';
import StrategyHistory from './StrategyHistory';
import BacktestProgress from './BacktestProgress';
import BacktestResults from '../BacktestResults';

interface StrategyBuilderLayoutProps {
  strategy: any;
  onStrategyChange: (updates: any) => void;
  onRunBacktest: () => void;
  isRunning: boolean;
  currentStep: string;
  onStrategySelect: (strategy: any) => void;
  backtestResults?: any;
  onAddToStrategy?: (codeSnippet: string) => void;
  onTestReverseStrategy?: () => void;
  isReverseTestRunning?: boolean;
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Strategy Builder */}
      <div className="space-y-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Play className="h-5 w-5" />
              Strategy Builder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="python" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-700">
                <TabsTrigger value="python">
                  <Code className="h-4 w-4 mr-2" />
                  Python
                </TabsTrigger>
                <TabsTrigger value="high-performance">
                  <Languages className="h-4 w-4 mr-2" />
                  200%+ AI
                </TabsTrigger>
                <TabsTrigger value="visual">
                  <Eye className="h-4 w-4 mr-2" />
                  Visual
                </TabsTrigger>
                <TabsTrigger value="config">
                  <Settings className="h-4 w-4 mr-2" />
                  Config
                </TabsTrigger>
              </TabsList>

              <TabsContent value="python">
                <PythonStrategyTab
                  strategy={strategy}
                  onStrategyChange={onStrategyChange}
                  onRunBacktest={onRunBacktest}
                  isRunning={isRunning}
                  backtestResults={backtestResults}
                />
              </TabsContent>

              <TabsContent value="high-performance">
                <HighPerformanceStrategiesTab
                  onStrategyChange={onStrategyChange}
                />
              </TabsContent>

              <TabsContent value="visual">
                <VisualStrategyTab
                  strategy={strategy}
                  onStrategyChange={onStrategyChange}
                  onAddToStrategy={onAddToStrategy}
                />
              </TabsContent>

              <TabsContent value="config">
                <StrategyConfiguration
                  strategy={strategy}
                  onStrategyChange={onStrategyChange}
                  onRunBacktest={onRunBacktest}
                  isRunning={isRunning}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {isRunning && (
          <BacktestProgress currentStep={currentStep} />
        )}
      </div>

      {/* Right Column - Results and History */}
      <div className="space-y-6">
        <BacktestResults 
          results={backtestResults} 
          onAddToStrategy={onAddToStrategy}
          onTestReverseStrategy={onTestReverseStrategy}
          isReverseTestRunning={isReverseTestRunning}
        />
        
        <StrategyHistory onStrategySelect={onStrategySelect} />
      </div>
    </div>
  );
};

export default StrategyBuilderLayout;
