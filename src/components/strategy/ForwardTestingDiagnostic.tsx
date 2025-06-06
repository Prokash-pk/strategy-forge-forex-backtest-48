
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Play, RefreshCw } from 'lucide-react';
import { useOANDAIntegration } from '@/hooks/useOANDAIntegration';
import { ForwardTestingService } from '@/services/forwardTestingService';
import { AutoStrategyTester } from '@/services/autoTesting/autoStrategyTester';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
}

const ForwardTestingDiagnostic: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const {
    config,
    selectedStrategy,
    isConnected,
    connectionStatus,
    isForwardTestingActive
  } = useOANDAIntegration();

  const runDiagnostic = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    try {
      // 1. OANDA Configuration Check
      console.log('🔍 Step 1: Validating OANDA Configuration...');
      if (config.accountId && config.apiKey) {
        results.push({
          step: 'OANDA Configuration',
          status: 'success',
          message: `Account ID: ${config.accountId.substring(0, 8)}... | Environment: ${config.environment}`,
          details: { accountId: config.accountId, environment: config.environment }
        });
      } else {
        results.push({
          step: 'OANDA Configuration',
          status: 'error',
          message: 'Missing Account ID or API Key',
          details: { hasAccountId: !!config.accountId, hasApiKey: !!config.apiKey }
        });
      }

      // 2. OANDA Connection Status
      console.log('🔍 Step 2: Checking OANDA Connection...');
      results.push({
        step: 'OANDA Connection',
        status: isConnected ? 'success' : 'error',
        message: isConnected ? 'Connected and authenticated' : `Connection failed: ${connectionStatus}`,
        details: { isConnected, connectionStatus }
      });

      // 3. Strategy Validation
      console.log('🔍 Step 3: Validating Strategy...');
      if (selectedStrategy) {
        const hasValidCode = selectedStrategy.strategy_code && selectedStrategy.strategy_code.trim().length > 0;
        results.push({
          step: 'Strategy Validation',
          status: hasValidCode ? 'success' : 'warning',
          message: hasValidCode 
            ? `Strategy "${selectedStrategy.strategy_name}" loaded (${selectedStrategy.symbol})`
            : 'Strategy selected but no code found',
          details: { 
            strategyName: selectedStrategy.strategy_name,
            symbol: selectedStrategy.symbol,
            hasCode: hasValidCode,
            codeLength: selectedStrategy.strategy_code?.length || 0
          }
        });
      } else {
        results.push({
          step: 'Strategy Validation',
          status: 'error',
          message: 'No strategy selected',
          details: { selectedStrategy: null }
        });
      }

      // 4. Forward Testing Status
      console.log('🔍 Step 4: Checking Forward Testing Status...');
      const forwardTestingService = ForwardTestingService.getInstance();
      const activeSessions = await forwardTestingService.getActiveSessions();
      
      results.push({
        step: 'Forward Testing Status',
        status: isForwardTestingActive ? 'success' : 'warning',
        message: isForwardTestingActive 
          ? `Active (${activeSessions.length} sessions running)`
          : 'Not currently active',
        details: { isActive: isForwardTestingActive, sessionCount: activeSessions.length }
      });

      // 5. Auto Strategy Tester Status
      console.log('🔍 Step 5: Checking Auto Strategy Tester...');
      const autoTester = AutoStrategyTester.getInstance();
      const testerStatus = autoTester.getStatus();
      
      results.push({
        step: 'Auto Strategy Tester',
        status: testerStatus.isRunning ? 'success' : 'warning',
        message: testerStatus.isRunning ? 'Running and monitoring signals' : 'Not currently running',
        details: testerStatus
      });

      // 6. Recent Trading Logs Check
      console.log('🔍 Step 6: Checking Recent Trading Logs...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: logs, error } = await supabase
            .from('trading_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false })
            .limit(5);

          if (error) throw error;

          const recentLogs = logs || [];
          const tradeExecutions = recentLogs.filter(log => log.log_type === 'trade_execution');
          
          results.push({
            step: 'Recent Trading Activity',
            status: recentLogs.length > 0 ? 'success' : 'warning',
            message: `${recentLogs.length} recent logs, ${tradeExecutions.length} trade executions`,
            details: { 
              totalLogs: recentLogs.length,
              tradeExecutions: tradeExecutions.length,
              mostRecentLog: recentLogs[0]?.timestamp || 'None'
            }
          });
        }
      } catch (error) {
        results.push({
          step: 'Recent Trading Activity',
          status: 'error',
          message: `Failed to check logs: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { error: String(error) }
        });
      }

      // 7. Manual Signal Test (if everything is ready)
      if (isConnected && selectedStrategy && isForwardTestingActive) {
        console.log('🔍 Step 7: Running Manual Signal Test...');
        try {
          const testResult = await autoTester.runSingleTest(config, selectedStrategy);
          
          results.push({
            step: 'Manual Signal Test',
            status: testResult.strategySignals.hasEntry ? 'success' : 'warning',
            message: testResult.strategySignals.hasEntry 
              ? `Signal detected: ${testResult.strategySignals.direction} at ${testResult.currentPrice}`
              : 'No entry signals detected in current market conditions',
            details: testResult
          });
        } catch (error) {
          results.push({
            step: 'Manual Signal Test',
            status: 'error',
            message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: { error: String(error) }
          });
        }
      } else {
        results.push({
          step: 'Manual Signal Test',
          status: 'pending',
          message: 'Skipped - prerequisites not met',
          details: { reason: 'OANDA not connected or strategy not loaded or forward testing not active' }
        });
      }

    } catch (error) {
      console.error('Diagnostic error:', error);
      results.push({
        step: 'Diagnostic Error',
        status: 'error',
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: String(error) }
      });
    }

    setDiagnostics(results);
    setIsRunning(false);

    // Log summary to console
    console.log('🧪 DIAGNOSTIC SUMMARY:');
    console.log('='.repeat(50));
    results.forEach(result => {
      const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${result.step}: ${result.message}`);
    });
    console.log('='.repeat(50));
  };

  // Auto-refresh diagnostics every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!isRunning) {
        runDiagnostic();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, isRunning]);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-600';
      case 'error': return 'bg-red-600';
      case 'warning': return 'bg-yellow-600';
      case 'pending': return 'bg-gray-600';
    }
  };

  const successCount = diagnostics.filter(d => d.status === 'success').length;
  const errorCount = diagnostics.filter(d => d.status === 'error').length;
  const warningCount = diagnostics.filter(d => d.status === 'warning').length;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Forward Testing Diagnostic
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-emerald-600" : ""}
            >
              Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            <Button
              onClick={runDiagnostic}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Run Diagnostic
            </Button>
          </div>
        </CardTitle>
        {diagnostics.length > 0 && (
          <div className="flex gap-2 mt-2">
            <Badge className="bg-green-600">{successCount} Success</Badge>
            <Badge className="bg-yellow-600">{warningCount} Warning</Badge>
            <Badge className="bg-red-600">{errorCount} Error</Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {diagnostics.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">Click "Run Diagnostic" to check your forward testing setup</p>
          </div>
        ) : (
          <div className="space-y-3">
            {diagnostics.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(result.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-white">{result.step}</h4>
                    <Badge variant="secondary" className={getStatusColor(result.status)}>
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-300">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                        View Details
                      </summary>
                      <pre className="text-xs text-slate-400 mt-1 bg-slate-800 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {diagnostics.length > 0 && (
          <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
            <h4 className="font-medium text-white mb-2">Next Steps:</h4>
            <ul className="text-sm text-slate-300 space-y-1">
              {errorCount > 0 && (
                <li>• Fix any errors shown above before proceeding</li>
              )}
              {warningCount > 0 && (
                <li>• Review warnings - some may need attention</li>
              )}
              {successCount === diagnostics.length && (
                <li>• ✅ All systems ready! Forward testing should be working correctly</li>
              )}
              <li>• Check browser console for detailed logs during operation</li>
              <li>• Monitor the Dashboard tab for real-time trade activity</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ForwardTestingDiagnostic;
