
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOANDAIntegration } from '@/hooks/useOANDAIntegration';
import { DiagnosticItem, OverallStatus } from './comprehensive/types';
import { DiagnosticRunner } from './comprehensive/DiagnosticRunner';
import { DiagnosticStatusDisplay } from './comprehensive/DiagnosticStatusDisplay';
import DiagnosticSection from './comprehensive/DiagnosticSection';
import { DiagnosticUtils } from './comprehensive/DiagnosticUtils';

const ComprehensiveForwardTestingDiagnostics: React.FC = () => {
  const { user } = useAuth();
  const { config, selectedStrategy, isConnected, connectionStatus } = useOANDAIntegration();
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<OverallStatus>('checking');

  const runComprehensiveDiagnostics = async () => {
    setIsRunning(true);
    const allResults: DiagnosticItem[] = [];

    try {
      console.log('🔍 Starting Comprehensive Diagnostics...');

      // Run all diagnostic categories
      const pythonResults = await DiagnosticRunner.runPythonDiagnostics();
      const strategyResults = await DiagnosticRunner.runStrategyDiagnostics(selectedStrategy);
      const oandaResults = await DiagnosticRunner.runOANDADiagnostics(config);
      const serverResults = await DiagnosticRunner.runServerDiagnostics();
      const systemResults = DiagnosticRunner.runSystemDiagnostics(user, config);

      allResults.push(...pythonResults, ...strategyResults, ...oandaResults, ...serverResults, ...systemResults);

      setDiagnostics(allResults);
      setOverallStatus(DiagnosticUtils.calculateOverallStatus(allResults));

    } catch (error) {
      console.error('❌ Diagnostics error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runComprehensiveDiagnostics();
  }, []);

  const groupedDiagnostics = DiagnosticUtils.groupDiagnostics(diagnostics);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Forward Testing Comprehensive Diagnostics
          </div>
          <Button 
            onClick={runComprehensiveDiagnostics} 
            disabled={isRunning}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? 'Checking...' : 'Run Full Diagnostics'}
          </Button>
        </CardTitle>
        <DiagnosticStatusDisplay overallStatus={overallStatus} />
      </CardHeader>
      <CardContent className="space-y-6">
        
        <DiagnosticSection 
          title="Python Strategy Engine" 
          icon="🐍" 
          items={groupedDiagnostics.python} 
        />

        <DiagnosticSection 
          title="Strategy Configuration" 
          icon="📈" 
          items={groupedDiagnostics.strategy} 
        />

        <DiagnosticSection 
          title="OANDA Trading Platform" 
          icon="🏦" 
          items={groupedDiagnostics.oanda} 
        />

        <DiagnosticSection 
          title="24/7 Server Operations" 
          icon="🖥️" 
          items={groupedDiagnostics.server} 
        />

        <DiagnosticSection 
          title="Trading Safety & System" 
          icon="🛡️" 
          items={[...groupedDiagnostics.trading, ...groupedDiagnostics.system]} 
        />

        <Separator className="bg-slate-600" />
        
        <div className="text-xs text-slate-400 text-center">
          Last check: {new Date().toLocaleString()} • {diagnostics.length} diagnostics completed
        </div>
      </CardContent>
    </Card>
  );
};

export default ComprehensiveForwardTestingDiagnostics;
