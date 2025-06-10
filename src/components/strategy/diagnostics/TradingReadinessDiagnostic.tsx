
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Settings } from 'lucide-react';
import { OverallStatusBadge } from './OverallStatusBadge';
import { DiagnosticCheckItem } from './DiagnosticCheckItem';
import { StatusMessage } from './StatusMessage';
import { useDiagnosticChecks } from './useDiagnosticChecks';

const TradingReadinessDiagnostic: React.FC = () => {
  const { checks, isRunning, overallStatus, runDiagnostics } = useDiagnosticChecks();

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Auto Trading Readiness Check
          </div>
          <OverallStatusBadge status={overallStatus} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-slate-300">
            Comprehensive check to verify all systems are ready for automated trading
          </p>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? <Activity className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
            {isRunning ? 'Checking...' : 'Run Diagnostics'}
          </Button>
        </div>

        <div className="space-y-3">
          {checks.map((check, index) => (
            <DiagnosticCheckItem key={index} check={check} />
          ))}
        </div>

        <StatusMessage status={overallStatus} />

        <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-600">
          Last check: {new Date().toLocaleString()} • {checks.length} checks completed
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingReadinessDiagnostic;
