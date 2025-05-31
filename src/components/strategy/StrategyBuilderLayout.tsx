
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Settings, BarChart3, TrendingUp } from 'lucide-react';
import StrategyConfiguration from './StrategyConfiguration';
import PythonStrategyTab from './PythonStrategyTab';
import StrategyRecommendationsTab from './StrategyRecommendationsTab';
import OANDAIntegration from './OANDAIntegration';
import { ForwardTestingService } from '@/services/forwardTestingService';

interface StrategyBuilderLayoutProps {
  strategy: any;
  onStrategyChange: (updates: any) => void;
  onRunBacktest?: () => void;
  isRunning?: boolean;
  currentStep?: string;
  onStrategySelect: (strategy: any) => void;
  backtestResults?: any;
  onAddToStrategy: (codeSnippet: string) => void;
  onTestReverseStrategy?: () => void;
  isReverseTestRunning?: boolean;
}

const StrategyBuilderLayout: React.FC<StrategyBuilderLayoutProps> = ({
  strategy,
  onStrategyChange,
  onRunBacktest,
  isRunning = false,
  currentStep,
  onStrategySelect,
  backtestResults,
  onAddToStrategy,
  onTestReverseStrategy,
  isReverseTestRunning = false
}) => {
  const [isForwardTestingActive, setIsForwardTestingActive] = React.useState(false);
  const forwardTestingService = ForwardTestingService.getInstance();

  React.useEffect(() => {
    setIsForwardTestingActive(forwardTestingService.isActive());
  }, []);

  const handleToggleForwardTesting = async (active: boolean) => {
    if (active) {
      // Get OANDA config from localStorage (in a real app, you'd store this securely)
      const configStr = localStorage.getItem('oanda_config');
      if (configStr) {
        const config = JSON.parse(configStr);
        await forwardTestingService.startForwardTesting({
          strategyId: strategy.name,
          oandaAccountId: config.accountId,
          oandaApiKey: config.apiKey,
          environment: config.environment,
          enabled: config.enabled
        }, strategy);
        setIsForwardTestingActive(true);
      }
    } else {
      forwardTestingService.stopForwardTesting();
      setIsForwardTestingActive(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Tabs defaultValue="configuration" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="configuration">
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="python">
              <Code className="h-4 w-4 mr-2" />
              Python Code
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <BarChart3 className="h-4 w-4 mr-2" />
              AI Recommendations
            </TabsTrigger>
            <TabsTrigger value="forward-testing">
              <TrendingUp className="h-4 w-4 mr-2" />
              Forward Testing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configuration">
            <StrategyConfiguration
              strategy={strategy}
              onStrategyChange={onStrategyChange}
              onRunBacktest={onRunBacktest}
              isRunning={isRunning}
            />
          </TabsContent>

          <TabsContent value="python">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Code className="h-5 w-5" />
                  Python Strategy Editor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PythonStrategyTab
                  strategy={strategy}
                  onStrategyChange={onStrategyChange}
                  onRunBacktest={onRunBacktest}
                  isRunning={isRunning}
                  backtestResults={backtestResults}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <StrategyRecommendationsTab
              strategy={strategy}
              backtestResults={backtestResults}
              onStrategySelect={onStrategySelect}
              onAddToStrategy={onAddToStrategy}
              onTestReverseStrategy={onTestReverseStrategy}
              isReverseTestRunning={isReverseTestRunning}
            />
          </TabsContent>

          <TabsContent value="forward-testing">
            <OANDAIntegration
              strategy={strategy}
              isForwardTestingActive={isForwardTestingActive}
              onToggleForwardTesting={handleToggleForwardTesting}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Right sidebar can show status, live trades, etc. */}
      <div className="space-y-4">
        {isRunning && currentStep && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full"></div>
                <span className="text-white text-sm">{currentStep}</span>
              </div>
            </Card>
          </CardContent>
        )}

        {isForwardTestingActive && (
          <Card className="bg-slate-800 border-slate-700 border-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-emerald-400">Forward Testing Active</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-slate-400">
                Strategy is running live on OANDA demo account
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StrategyBuilderLayout;
