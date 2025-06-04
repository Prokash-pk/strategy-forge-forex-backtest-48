
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Search, Database, Activity, Clock, Server } from 'lucide-react';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';

interface TradingDiagnosticsProps {
  strategy: any;
}

const TradingDiagnostics: React.FC<TradingDiagnosticsProps> = ({ strategy }) => {
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Running Comprehensive Forward Testing Diagnostics...');
      
      // Check for active sessions
      const activeSessions = await ServerForwardTestingService.getActiveSessions();
      console.log('Active Sessions:', activeSessions);
      
      // Check trading logs from server
      const tradingLogs = await ServerForwardTestingService.getTradingLogs();
      console.log('Server Trading Logs:', tradingLogs);
      
      // Check localStorage for any stored strategy trades
      const storedTrades = localStorage.getItem('forward_testing_trades');
      const parsedTrades = storedTrades ? JSON.parse(storedTrades) : [];
      console.log('LocalStorage Trades:', parsedTrades);
      
      // Check for strategy results in localStorage
      const strategyResults = localStorage.getItem('backtest_results');
      const parsedResults = strategyResults ? JSON.parse(strategyResults) : null;
      console.log('Strategy Results:', parsedResults);
      
      // Check selected strategy settings
      const selectedStrategy = localStorage.getItem('selected_strategy_settings');
      const parsedStrategy = selectedStrategy ? JSON.parse(selectedStrategy) : null;
      console.log('Selected Strategy:', parsedStrategy);

      // Check OANDA config
      const oandaConfig = localStorage.getItem('oanda_config');
      const parsedOandaConfig = oandaConfig ? JSON.parse(oandaConfig) : null;
      console.log('OANDA Config:', parsedOandaConfig);

      // Check if forward testing is marked as active
      const forwardTestingActive = localStorage.getItem('forward_testing_active');
      console.log('Forward Testing Active Flag:', forwardTestingActive);
      
      setDiagnosticData({
        activeSessions,
        tradingLogs,
        localStorageTrades: parsedTrades,
        strategyResults: parsedResults,
        selectedStrategy: parsedStrategy,
        oandaConfig: parsedOandaConfig,
        forwardTestingActive,
        timestamp: new Date().toISOString(),
        // Analysis
        hasServerSessions: activeSessions?.length > 0,
        hasServerLogs: tradingLogs?.length > 0,
        hasLocalTrades: parsedTrades?.length > 0,
        strategyMatches: parsedStrategy?.strategy_name === strategy?.strategy_name,
        isConfigured: !!(parsedOandaConfig?.accountId && parsedOandaConfig?.apiKey)
      });
      
    } catch (error) {
      console.error('Diagnostics error:', error);
      setDiagnosticData({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-run diagnostics on mount
  useEffect(() => {
    runDiagnostics();
  }, []);

  const getDiagnosisMessage = () => {
    if (!diagnosticData || diagnosticData.error) return null;

    const { hasServerSessions, hasServerLogs, hasLocalTrades, strategyMatches, isConfigured } = diagnosticData;

    if (!isConfigured) {
      return {
        type: 'error',
        message: '❌ OANDA credentials not properly configured. Please check Configuration tab.'
      };
    }

    if (!strategyMatches) {
      return {
        type: 'warning',
        message: '⚠️ Strategy mismatch detected. The selected strategy may not match the active trading strategy.'
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

    if (hasServerSessions && hasServerLogs && !hasLocalTrades) {
      return {
        type: 'info',
        message: '✅ Server-side autonomous trading is working correctly. Trades are being executed server-side (this is expected behavior).'
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
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-sm">
            Investigating why Smart Momentum Strategy trades aren't visible
          </p>
          <Button
            onClick={runDiagnostics}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Analyzing...' : 'Re-run Diagnostics'}
          </Button>
        </div>

        {diagnosis && (
          <div className={`p-3 rounded-lg border ${
            diagnosis.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
            diagnosis.type === 'info' ? 'bg-blue-500/10 border-blue-500/20' :
            diagnosis.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
            'bg-red-500/10 border-red-500/20'
          }`}>
            <p className={`text-sm font-medium ${
              diagnosis.type === 'success' ? 'text-emerald-400' :
              diagnosis.type === 'info' ? 'text-blue-400' :
              diagnosis.type === 'warning' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {diagnosis.message}
            </p>
          </div>
        )}

        {diagnosticData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Server Sessions */}
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-4 w-4 text-blue-400" />
                  <span className="text-white text-sm font-medium">Server Sessions</span>
                </div>
                <Badge variant={diagnosticData.hasServerSessions ? "default" : "destructive"}>
                  {diagnosticData.activeSessions?.length || 0} Active
                </Badge>
                <p className="text-xs text-slate-400 mt-1">
                  {diagnosticData.hasServerSessions 
                    ? '✅ Autonomous trading running server-side'
                    : '❌ No server-side trading sessions'
                  }
                </p>
              </div>

              {/* Server Trading Logs */}
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span className="text-white text-sm font-medium">Server Logs</span>
                </div>
                <Badge variant={diagnosticData.hasServerLogs ? "default" : "secondary"}>
                  {diagnosticData.tradingLogs?.length || 0} Records
                </Badge>
                <p className="text-xs text-slate-400 mt-1">
                  Server-side trade execution logs
                </p>
              </div>

              {/* Configuration Status */}
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-purple-400" />
                  <span className="text-white text-sm font-medium">Configuration</span>
                </div>
                <Badge variant={diagnosticData.isConfigured ? "default" : "destructive"}>
                  {diagnosticData.isConfigured ? 'Configured' : 'Incomplete'}
                </Badge>
                <p className="text-xs text-slate-400 mt-1">
                  OANDA API credentials status
                </p>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <h4 className="text-white text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Detailed Analysis
              </h4>
              <div className="space-y-2 text-xs">
                {diagnosticData.error ? (
                  <p className="text-red-400">Error: {diagnosticData.error}</p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-slate-300">
                      <span className="text-slate-400">Last Check:</span> {new Date(diagnosticData.timestamp).toLocaleString()}
                    </p>
                    
                    {diagnosticData.selectedStrategy && (
                      <p className="text-slate-300">
                        <span className="text-slate-400">Selected Strategy:</span> {diagnosticData.selectedStrategy.strategy_name}
                      </p>
                    )}

                    {diagnosticData.oandaConfig && (
                      <p className="text-slate-300">
                        <span className="text-slate-400">OANDA Account:</span> {diagnosticData.oandaConfig.accountId} ({diagnosticData.oandaConfig.environment})
                      </p>
                    )}

                    <div className="mt-3 pt-2 border-t border-slate-600">
                      <p className="text-yellow-400 font-medium">Possible Issues:</p>
                      {!diagnosticData.hasServerSessions && (
                        <p className="text-yellow-300">• Forward testing may not be properly started on server</p>
                      )}
                      {diagnosticData.hasServerSessions && !diagnosticData.hasServerLogs && (
                        <p className="text-yellow-300">• Strategy may not have generated trading signals yet</p>
                      )}
                      {!diagnosticData.strategyMatches && (
                        <p className="text-yellow-300">• Strategy configuration mismatch detected</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Server Trading Logs Preview */}
            {diagnosticData.tradingLogs?.length > 0 && (
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <h4 className="text-white text-sm font-medium mb-2">Recent Server Trading Activity</h4>
                <div className="space-y-1">
                  {diagnosticData.tradingLogs.slice(0, 3).map((log: any, index: number) => (
                    <div key={index} className="text-xs p-2 bg-slate-600/50 rounded">
                      <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}:</span>
                      <span className="text-slate-300 ml-2">{log.message}</span>
                      {log.log_type === 'trade' && (
                        <Badge variant="default" className="ml-2 text-xs">Trade</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingDiagnostics;
