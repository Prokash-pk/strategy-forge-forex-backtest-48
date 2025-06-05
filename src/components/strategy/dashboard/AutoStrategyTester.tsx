
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestTube, Eye } from 'lucide-react';
import { useAutoTester } from './auto-tester/useAutoTester';
import AutoTesterConfig from './auto-tester/AutoTesterConfig';
import AutoTesterControls from './auto-tester/AutoTesterControls';
import AutoTesterInfoBox from './auto-tester/AutoTesterInfoBox';
import AutoTesterConfigWarning from './auto-tester/AutoTesterConfigWarning';

interface AutoStrategyTesterProps {
  strategy: any;
  oandaConfig: any;
  isConfigured: boolean;
}

const AutoStrategyTesterComponent: React.FC<AutoStrategyTesterProps> = ({
  strategy,
  oandaConfig,
  isConfigured
}) => {
  const {
    isTestingActive,
    testInterval,
    testCount,
    setTestInterval,
    handleStartTesting,
    handleStopTesting,
    handleRunSingleTest
  } = useAutoTester({ strategy, oandaConfig, isConfigured });

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TestTube className="h-5 w-5" />
          Auto Strategy Tester
          {isTestingActive && (
            <Badge variant="default" className="bg-blue-600">
              <Eye className="h-3 w-3 mr-1" />
              Testing Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <AutoTesterConfig
          testInterval={testInterval}
          onTestIntervalChange={setTestInterval}
          testCount={testCount}
          isTestingActive={isTestingActive}
        />

        <AutoTesterControls
          isTestingActive={isTestingActive}
          isConfigured={isConfigured}
          onStartTesting={handleStartTesting}
          onStopTesting={handleStopTesting}
          onRunSingleTest={handleRunSingleTest}
        />

        <AutoTesterInfoBox />

        <AutoTesterConfigWarning isConfigured={isConfigured} />
      </CardContent>
    </Card>
  );
};

export default AutoStrategyTesterComponent;
