import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Search, Database, Activity, Clock, Server, Settings, FileSearch } from 'lucide-react';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import ForwardTestingInvestigator from './diagnostics/ForwardTestingInvestigator';
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
import { useAuth } from '@/hooks/useAuth';

interface TradingDiagnosticsProps {
  strategy: any;
}

const TradingDiagnostics: React.FC<TradingDiagnosticsProps> = ({ strategy }) => {
  const { user } = useAuth();
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [comprehensiveDiagnostics, setComprehensiveDiagnostics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [investigationResults, setInvestigationResults] = useState<any>(null);

  const runFullDiagnostics = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Running Comprehensive Forward Testing Diagnostics...');
      
      // Run comprehensive diagnostics
      const results: any[] = [];

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

      setComprehensiveDiagnostics(results);
      
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
    runFullDiagnostics();
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return {
          label: 'Success',
          bgColor: 'bg-emerald-500',
          textColor: 'text-white',
          iconColor: 'text-emerald-500'
        };
      case 'WARNING':
        return {
          label: 'Warning',
          bgColor: 'bg-yellow-500',
          textColor: 'text-white',
          iconColor: 'text-yellow-500'
        };
      case 'ERROR':
        return {
          label: 'Error',
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          iconColor: 'text-red-500'
        };
      default:
        return {
          label: 'Unknown',
          bgColor: 'bg-slate-500',
          textColor: 'text-white',
          iconColor: 'text-slate-500'
        };
    }
  };

  const diagnosis = getDiagnosisMessage();

  // Calculate comprehensive stats
  const comprehensiveStats = {
    successCount: comprehensiveDiagnostics.filter(d => d.status === 'SUCCESS').length,
    warningCount: comprehensiveDiagnostics.filter(d => d.status === 'WARNING').length,
    errorCount: comprehensiveDiagnostics.filter(d => d.status === 'ERROR').length
  };

  return (
    <div className="space-y-6">
      {/* New Investigation Component */}
      <ForwardTestingInvestigator onDiagnosisComplete={setInvestigationResults} />

      {/* Original Diagnostics */}
      <Card className="bg-slate-800 border-slate-700 w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base">
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            Detailed System Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              Comprehensive system analysis and forward testing investigation
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
          {comprehensiveDiagnostics.length > 0 && (
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-emerald-400">{comprehensiveStats.successCount} Success</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-400">{comprehensiveStats.warningCount} Warning</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-red-400">{comprehensiveStats.errorCount} Error</span>
              </div>
            </div>
          )}

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

          {/* Modern Status Cards */}
          {diagnosticData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Server Sessions Card */}
                <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-slate-500 min-h-[120px] flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <Server className={`h-8 w-8 ${diagnosticData.hasServerSessions ? 'text-emerald-500' : 'text-red-500'}`} />
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-base">Server Sessions</h3>
                      <p className="text-slate-400 text-sm">{diagnosticData.activeSessions?.length || 0} Active</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <Badge 
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        diagnosticData.hasServerSessions 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {diagnosticData.hasServerSessions ? 'Success' : 'Error'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {diagnosticData.hasServerSessions 
                      ? '✅ Autonomous trading running server-side'
                      : '❌ No server-side trading sessions'
                    }
                  </p>
                </div>

                {/* Server Logs Card */}
                <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-slate-500 min-h-[120px] flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <FileSearch className={`h-8 w-8 ${diagnosticData.hasServerLogs ? 'text-emerald-500' : 'text-yellow-500'}`} />
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-base">Server Logs</h3>
                      <p className="text-slate-400 text-sm">{diagnosticData.tradingLogs?.length || 0} Records</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <Badge 
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        diagnosticData.hasServerLogs 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-yellow-500 text-white'
                      }`}
                    >
                      {diagnosticData.hasServerLogs ? 'Success' : 'Warning'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Server-side trade execution logs
                  </p>
                </div>

                {/* Configuration Card */}
                <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-slate-500 min-h-[120px] flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <Settings className={`h-8 w-8 ${diagnosticData.isConfigured ? 'text-emerald-500' : 'text-red-500'}`} />
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-base">Configuration</h3>
                      <p className="text-slate-400 text-sm">OANDA API Setup</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <Badge 
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        diagnosticData.isConfigured 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {diagnosticData.isConfigured ? 'Success' : 'Incomplete'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    OANDA API credentials status
                  </p>
                </div>
              </div>

              {/* Comprehensive Diagnostics Results */}
              {comprehensiveDiagnostics.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-white font-semibold text-base border-b border-slate-600 pb-2">
                    Detailed System Diagnostics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {comprehensiveDiagnostics.map((diagnostic, index) => {
                      const statusConfig = getStatusConfig(diagnostic.status);
                      const IconComponent = diagnostic.iconType === 'user' ? Activity :
                                          diagnostic.iconType === 'settings' ? Settings :
                                          diagnostic.iconType === 'wifi' ? Activity :
                                          diagnostic.iconType === 'server' ? Server :
                                          diagnostic.iconType === 'database' ? Database :
                                          diagnostic.iconType === 'activity' ? Activity :
                                          Settings;

                      return (
                        <div key={index} className="bg-slate-700/20 border border-slate-600 rounded-lg p-4 hover:bg-slate-700/30 transition-colors">
                          <div className="flex items-start gap-3">
                            <IconComponent className={`h-5 w-5 mt-0.5 ${statusConfig.iconColor}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-white font-medium text-sm">{diagnostic.name}</h5>
                                <Badge 
                                  className={`rounded-full px-2 py-0.5 text-xs ${statusConfig.bgColor} ${statusConfig.textColor}`}
                                >
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <p className="text-slate-300 text-sm">{diagnostic.message}</p>
                              {diagnostic.details && (
                                <details className="mt-2">
                                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                                    View Details
                                  </summary>
                                  <pre className="text-xs text-slate-400 mt-1 bg-slate-800 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(diagnostic.details, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detailed Analysis */}
              <div className="p-4 bg-slate-700/20 rounded-lg border border-slate-600">
                <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Analysis Summary
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
                <div className="p-4 bg-slate-700/20 rounded-lg border border-slate-600">
                  <h4 className="text-white text-sm font-medium mb-3">Recent Server Trading Activity</h4>
                  <div className="space-y-2">
                    {diagnosticData.tradingLogs.slice(0, 3).map((log: any, index: number) => (
                      <div key={index} className="text-xs p-3 bg-slate-600/50 rounded border border-slate-500">
                        <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}:</span>
                        <span className="text-slate-300 ml-2">{log.message}</span>
                        {log.log_type === 'trade' && (
                          <Badge variant="default" className="ml-2 text-xs bg-emerald-600">Trade</Badge>
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
    </div>
  );
};

export default TradingDiagnostics;
