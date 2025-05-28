
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Code, Languages } from 'lucide-react';
import StrategyTranslator from './StrategyTranslator';
import VisualStrategyTab from './VisualStrategyTab';
import PythonStrategyTab from './PythonStrategyTab';
import StrategyBasicSettings from './StrategyBasicSettings';

interface StrategyConfigurationProps {
  strategy: {
    name: string;
    symbol: string;
    timeframe: string;
    code: string;
  };
  onStrategyChange: (updates: any) => void;
}

const StrategyConfiguration: React.FC<StrategyConfigurationProps> = ({ strategy, onStrategyChange }) => {
  const [activeTab, setActiveTab] = React.useState('visual');

  const handleStrategyGenerated = (code: string) => {
    onStrategyChange({ code });
  };

  const handleSwitchToCode = () => {
    setActiveTab('python');
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
          <TabsList className="grid w-full grid-cols-3 bg-slate-700">
            <TabsTrigger value="visual">
              <Settings className="h-4 w-4 mr-2" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="english">
              <Languages className="h-4 w-4 mr-2" />
              English
            </TabsTrigger>
            <TabsTrigger value="python">
              <Code className="h-4 w-4 mr-2" />
              Python
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-4 mt-6">
            <StrategyBasicSettings 
              strategy={strategy} 
              onStrategyChange={onStrategyChange} 
            />
            <VisualStrategyTab />
          </TabsContent>

          <TabsContent value="english" className="mt-6">
            <StrategyTranslator 
              onStrategyGenerated={handleStrategyGenerated}
              onSwitchToCode={handleSwitchToCode}
            />
          </TabsContent>

          <TabsContent value="python">
            <PythonStrategyTab 
              strategy={strategy} 
              onStrategyChange={onStrategyChange} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StrategyConfiguration;
