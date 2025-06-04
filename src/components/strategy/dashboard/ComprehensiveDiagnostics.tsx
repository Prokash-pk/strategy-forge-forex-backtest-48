
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DiagnosticResult, DiagnosticStats } from './diagnostics/types';
import DiagnosticHeader from './diagnostics/DiagnosticHeader';
import DiagnosticStatsDisplay from './diagnostics/DiagnosticStats';
import DiagnosticSection from './diagnostics/DiagnosticSection';
import LoadingState from './diagnostics/LoadingState';
import {
  runAuthenticationCheck,
  runStrategyConfigCheck,
  runOandaConfigCheck,
  runOandaConnectivityCheck,
  runForwardTestingFlagCheck,
  runServerSessionsCheck,
  runServerLogsCheck,
  runDatabaseSessionsCheck,
  runEdgeFunctionsCheck
} from './diagnostics/diagnosticServices';

const ComprehensiveDiagnostics: React.FC = () => {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runFullDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    try {
      // Authentication Check
      results.push(runAuthenticationCheck(user));

      // Strategy Config Check
      results.push(runStrategyConfigCheck());

      // OANDA Config Check
      results.push(runOandaConfigCheck());

      // OANDA Connectivity Check
      results.push(await runOandaConnectivityCheck());

      // Forward Testing Flag Check
      results.push(runForwardTestingFlagCheck());

      // Server Sessions Check
      results.push(await runServerSessionsCheck());

      // Server Logs Check
      results.push(await runServerLogsCheck());

      // Database Sessions Check
      results.push(await runDatabaseSessionsCheck(user));

      // Edge Functions Check
      results.push(await runEdgeFunctionsCheck());

      setDiagnostics(results);
      console.log('🔍 Full Diagnostics Complete:', results);

    } catch (error) {
      console.error('Diagnostics error:', error);
      results.push({
        name: 'System Error',
        status: 'ERROR',
        message: `Diagnostics failed: ${error.message}`,
        details: { error: error.message },
        icon: <XCircle className="h-4 w-4" />,
        category: 'config'
      });
      setDiagnostics(results);
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-run diagnostics on mount
  useEffect(() => {
    runFullDiagnostics();
  }, []);

  const stats: DiagnosticStats = {
    successCount: diagnostics.filter(d => d.status === 'SUCCESS').length,
    warningCount: diagnostics.filter(d => d.status === 'WARNING').length,
    errorCount: diagnostics.filter(d => d.status === 'ERROR').length
  };

  // Group diagnostics by category
  const groupedDiagnostics = {
    auth: diagnostics.filter(d => d.category === 'auth'),
    config: diagnostics.filter(d => d.category === 'config'),
    connectivity: diagnostics.filter(d => d.category === 'connectivity'),
    forward_testing: diagnostics.filter(d => d.category === 'forward_testing')
  };

  return (
    <Card className="bg-slate-800 border-slate-700 w-full">
      <CardHeader>
        <DiagnosticHeader isRunning={isRunning} onRunDiagnostics={runFullDiagnostics} />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <DiagnosticStatsDisplay stats={stats} />

        {/* Diagnostic Results - Organized by category */}
        <DiagnosticSection title="Authentication & User" items={groupedDiagnostics.auth} />
        <DiagnosticSection title="Configuration" items={groupedDiagnostics.config} />
        <DiagnosticSection title="Connectivity" items={groupedDiagnostics.connectivity} />
        <DiagnosticSection title="Forward Testing Investigation" items={groupedDiagnostics.forward_testing} />

        <LoadingState isRunning={isRunning} hasResults={diagnostics.length > 0} />

        {/* Timestamp */}
        {diagnostics.length > 0 && (
          <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-600">
            Last check: {new Date().toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComprehensiveDiagnostics;
