
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Search, Clock } from 'lucide-react';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { useAuth } from '@/hooks/useAuth';
import { DiagnosticResult, DiagnosticStats } from './diagnostics/types';
import DiagnosticItem from './diagnostics/DiagnosticItem';
import DiagnosticSection from './diagnostics/DiagnosticSection';
import DiagnosticStatsDisplay from './diagnostics/DiagnosticStats';
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

interface TradingDiagnosticsProps {
  strategy: any;
}

const TradingDiagnostics: React.FC<TradingDiagnosticsProps> = ({ strategy }) => {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runFullDiagnostics = async () => {
    setIsLoading(true);
    const results: DiagnosticResult[] = [];

    try {
      console.log('🔍 Running Comprehensive Forward Testing Diagnostics...');
      
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
        iconType: 'settings',
        category: 'config'
      });
      setDiagnostics(results);
    } finally {
      setIsLoading(false);
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

  const getDiagnosisMessage = () => {
    if (!diagnostics.length || diagnostics.some(d => d.name === 'System Error')) return null;

    const hasServerSessions = groupedDiagnostics.forward_testing.some(d => 
      d.name === 'Server Sessions' && d.status === 'SUCCESS'
    );
    const hasServerLogs = groupedDiagnostics.forward_testing.some(d => 
      d.name === 'Server Logs' && d.status === 'SUCCESS'
    );
    const isConfigured = groupedDiagnostics.config.every(d => d.status === 'SUCCESS');
    const isAuthenticated = groupedDiagnostics.auth.some(d => d.status === 'SUCCESS');

    if (!isAuthenticated) {
      return {
        type: 'error',
        message: '❌ Authentication required. Please log in to continue.'
      };
    }

    if (!isConfigured) {
      return {
        type: 'error',
        message: '❌ Configuration incomplete. Please check Configuration tab and ensure OANDA credentials are properly set.'
      };
    }

    if (!hasServerSessions) {
      return {
        type: 'error',
        message: '❌ No autonomous trading sessions found on server. Forward testing may not be truly active.'
      };
    }

    if (hasServerSessions && !hasServerLogs) {
      return {
        type: 'warning',
        message: '⚠️ Server sessions active but no trades logged. This could mean: 1) Strategy hasn\'t generated signals yet, 2) Market conditions don\'t meet strategy criteria, or 3) Execution issue.'
      };
    }

    return {
      type: 'success',
      message: '✅ Forward testing appears to be working correctly across all systems.'
    };
  };

  const diagnosis = getDiagnosisMessage();

  return (
    <Card className="bg-slate-800 border-slate-700 w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base">
          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          Forward Testing Investigation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-sm">
            Comprehensive system diagnostics for forward testing
          </p>
          <Button
            onClick={runFullDiagnostics}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Analyzing...' : 'Re-run Diagnostics'}
          </Button>
        </div>

        {/* Summary Stats */}
        {diagnostics.length > 0 && (
          <DiagnosticStatsDisplay stats={stats} />
        )}

        {diagnosis && (
          <div className={`p-3 rounded-lg border ${
            diagnosis.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
            diagnosis.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
            'bg-red-500/10 border-red-500/20'
          }`}>
            <p className={`text-sm font-medium ${
              diagnosis.type === 'success' ? 'text-emerald-400' :
              diagnosis.type === 'warning' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {diagnosis.message}
            </p>
          </div>
        )}

        {/* Diagnostic Results - Organized by category */}
        {diagnostics.length > 0 && (
          <div className="space-y-6">
            <DiagnosticSection title="Authentication & User" items={groupedDiagnostics.auth} />
            <DiagnosticSection title="Configuration" items={groupedDiagnostics.config} />
            <DiagnosticSection title="Connectivity" items={groupedDiagnostics.connectivity} />
            <DiagnosticSection title="Forward Testing System" items={groupedDiagnostics.forward_testing} />
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-3 text-slate-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400"></div>
              <span className="text-sm">Running comprehensive diagnostics...</span>
            </div>
          </div>
        )}

        {/* Timestamp */}
        {diagnostics.length > 0 && (
          <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-600">
            <Clock className="h-3 w-3 inline mr-1" />
            Last check: {new Date().toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingDiagnostics;
