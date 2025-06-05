
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  const [progress, setProgress] = useState(0);

  const runFullDiagnostics = async () => {
    setIsRunning(true);
    setProgress(0);
    setDiagnostics([]); // Clear previous results
    const results: DiagnosticResult[] = [];

    try {
      console.log('🔍 Starting Comprehensive Diagnostics...');

      // Define all diagnostic tasks
      const diagnosticTasks = [
        { name: 'Authentication', fn: () => runAuthenticationCheck(user) },
        { name: 'Strategy Config', fn: () => runStrategyConfigCheck() },
        { name: 'OANDA Config', fn: () => runOandaConfigCheck() },
        { name: 'OANDA Connectivity', fn: () => runOandaConnectivityCheck() },
        { name: 'Forward Testing Flag', fn: () => runForwardTestingFlagCheck() },
        { name: 'Server Sessions', fn: () => runServerSessionsCheck() },
        { name: 'Server Logs', fn: () => runServerLogsCheck() },
        { name: 'Database Sessions', fn: () => runDatabaseSessionsCheck(user) },
        { name: 'Edge Functions', fn: () => runEdgeFunctionsCheck() }
      ];

      // Run diagnostics with progress tracking
      for (let i = 0; i < diagnosticTasks.length; i++) {
        const task = diagnosticTasks[i];
        console.log(`🔍 Running: ${task.name}`);
        
        try {
          const result = await task.fn();
          results.push(result);
          setProgress(((i + 1) / diagnosticTasks.length) * 100);
          
          // Update results incrementally for better UX
          setDiagnostics([...results]);
        } catch (error) {
          console.error(`❌ Failed: ${task.name}`, error);
          results.push({
            name: task.name,
            status: 'ERROR',
            message: `${task.name} check failed: ${error.message}`,
            details: { error: error.message },
            iconType: 'settings',
            category: 'config'
          });
          setDiagnostics([...results]);
        }
      }

      console.log('🔍 Full Diagnostics Complete:', results);

    } catch (error) {
      console.error('❌ Diagnostics error:', error);
      results.push({
        name: 'System Error',
        status: 'ERROR',
        message: `Diagnostics failed: ${error.message}`,
        details: { error: error.message },
        iconType: 'settings',
        category: 'config'
      });
      setDiagnostics(results);
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  // Auto-run diagnostics on mount with faster execution
  useEffect(() => {
    const timer = setTimeout(() => {
      runFullDiagnostics();
    }, 100); // Small delay to prevent blocking

    return () => clearTimeout(timer);
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
        {isRunning && progress > 0 && (
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        {diagnostics.length > 0 && <DiagnosticStatsDisplay stats={stats} />}

        {/* Diagnostic Results - Show as they complete */}
        {groupedDiagnostics.auth.length > 0 && (
          <DiagnosticSection title="Authentication & User" items={groupedDiagnostics.auth} />
        )}
        {groupedDiagnostics.config.length > 0 && (
          <DiagnosticSection title="Configuration" items={groupedDiagnostics.config} />
        )}
        {groupedDiagnostics.connectivity.length > 0 && (
          <DiagnosticSection title="Connectivity" items={groupedDiagnostics.connectivity} />
        )}
        {groupedDiagnostics.forward_testing.length > 0 && (
          <DiagnosticSection title="Forward Testing Investigation" items={groupedDiagnostics.forward_testing} />
        )}

        <LoadingState isRunning={isRunning} hasResults={diagnostics.length > 0} />

        {/* Timestamp */}
        {diagnostics.length > 0 && !isRunning && (
          <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-600">
            Last check: {new Date().toLocaleString()} ({diagnostics.length} checks completed)
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComprehensiveDiagnostics;
