
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, TrendingUp, Bot, Lightbulb, Brain } from 'lucide-react';
import StrategyConfiguration from './StrategyConfiguration';
import StrategyRecommendationsTab from './StrategyRecommendationsTab';
import AIStrategyCoach from './AIStrategyCoach';

interface StrategyBuilderLayoutProps {
  strategy: any;
  onStrategyChange: (updates: any) => void;
  onRunBacktest: () => void;
  isRunning: boolean;
  currentStep?: string;
  onStrategySelect: (strategy: any) => void;
  backtestResults?: any;
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
    <div className="space-y-6">
      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-700">
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="ai-coach" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Coach
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <StrategyConfiguration
            strategy={strategy}
            onStrategyChange={onStrategyChange}
            onRunBacktest={onRunBacktest}
            isRunning={isRunning}
          />
        </TabsContent>

        <TabsContent value="ai-coach" className="space-y-4">
          <AIStrategyCoach
            strategy={strategy}
            backtestResults={backtestResults}
            onStrategyUpdate={onStrategyChange}
          />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <StrategyRecommendationsTab
            strategy={strategy}
            backtestResults={backtestResults}
            onStrategyChange={onStrategyChange}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Bot className="h-12 w-12 text-blue-400 mx-auto" />
                <h3 className="text-lg font-medium text-white">Performance Analysis</h3>
                <p className="text-slate-300">
                  Advanced performance analytics coming soon. Use AI Coach for immediate strategy improvements.
                </p>
                
                {backtestResults && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="text-slate-400 text-sm">Current Win Rate</div>
                      <div className="text-2xl font-bold text-white">
                        {backtestResults.winRate?.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="text-slate-400 text-sm">Total Return</div>
                      <div className="text-2xl font-bold text-white">
                        {backtestResults.totalReturn?.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StrategyBuilderLayout;
