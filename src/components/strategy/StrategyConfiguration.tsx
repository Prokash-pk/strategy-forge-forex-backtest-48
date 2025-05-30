
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Code, Languages } from 'lucide-react';
import StrategyTranslator from './StrategyTranslator';
import StrategyConfigurationTab from './StrategyConfigurationTab';

interface StrategyConfigurationProps {
  strategy: {
    name: string;
    symbol: string;
    timeframe: string;
    code: string;
    initialBalance: number;
    riskPerTrade: number;
    stopLoss: number;
    takeProfit: number;
    spread: number;
    commission: number;
    slippage: number;
    maxPositionSize: number;
    riskModel: string;
    positionSizingMode: string;
    riskRewardRatio: number;
  };
  onStrategyChange: (updates: any) => void;
  onRunBacktest?: () => void;
  isRunning?: boolean;
}

const StrategyConfiguration: React.FC<StrategyConfigurationProps> = ({ 
  strategy, 
  onStrategyChange,
  onRunBacktest,
  isRunning = false
}) => {
  const [activeTab, setActiveTab] = React.useState('configuration');

  const handleStrategyGenerated = (code: string) => {
    onStrategyChange({ code });
  };

  const handleSwitchToCode = () => {
    setActiveTab('configuration');
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Settings className="h-5 w-5" />
          Strategy Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-slate-700">
            <TabsTrigger value="configuration">
              <Code className="h-4 w-4 mr-2" />
              Configuration & Code
            </TabsTrigger>
            <TabsTrigger value="english">
              <Languages className="h-4 w-4 mr-2" />
              English to Python
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configuration" className="space-y-4 mt-6">
            <StrategyConfigurationTab 
              strategy={strategy} 
              onStrategyChange={onStrategyChange}
              onRunBacktest={onRunBacktest}
              isRunning={isRunning}
            />
          </TabsContent>

          <TabsContent value="english" className="mt-6">
            <StrategyTranslator 
              onStrategyGenerated={handleStrategyGenerated}
              onSwitchToCode={handleSwitchToCode}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StrategyConfiguration;
