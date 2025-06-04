
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Search, Activity, Clock, Zap, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { StrategyExecutor } from '@/utils/strategyExecutor';
import { useToast } from '@/hooks/use-toast';

interface ForwardTestingInvestigatorProps {
  onDiagnosisComplete: (results: any) => void;
}

const ForwardTestingInvestigator: React.FC<ForwardTestingInvestigatorProps> = ({ onDiagnosisComplete }) => {
  const { toast } = useToast();
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [investigation, setInvestigation] = useState<any>(null);

  const runInvestigation = async () => {
    setIsInvestigating(true);
    try {
      console.log('🔍 Starting Comprehensive Forward Testing Investigation...');
      
      const results: any = {
        timestamp: new Date().toISOString(),
        findings: [],
        recommendations: [],
        status: 'unknown',
        tests: {}
      };

      // 1. Check localStorage configuration
      const selectedStrategy = localStorage.getItem('selected_strategy_settings');
      const oandaConfig = localStorage.getItem('oanda_config');
      const forwardTestingActive = localStorage.getItem('forward_testing_active');

      console.log('📋 Local Configuration Check:', {
        hasSelectedStrategy: !!selectedStrategy,
        hasOandaConfig: !!oandaConfig,
        forwardTestingFlag: forwardTestingActive
      });

      // 2. Parse and test strategy
      let strategyAnalysis = null;
      let strategyTest = { success: false, error: null, signals: null };
      
      if (selectedStrategy) {
        const strategy = JSON.parse(selectedStrategy);
        strategyAnalysis = {
          name: strategy.strategy_name,
          symbol: strategy.symbol,
          hasCode: !!strategy.strategy_code,
          codeLength: strategy.strategy_code?.length || 0,
          reverseSignals: strategy.reverse_signals || false
        };

        // Test strategy execution with sample data
        try {
          const sampleData = {
            open: Array(300).fill(0).map((_, i) => 1.1000 + Math.sin(i * 0.1) * 0.01),
            high: Array(300).fill(0).map((_, i) => 1.1020 + Math.sin(i * 0.1) * 0.01),
            low: Array(300).fill(0).map((_, i) => 0.9980 + Math.sin(i * 0.1) * 0.01),
            close: Array(300).fill(0).map((_, i) => 1.1000 + Math.sin(i * 0.1) * 0.01),
            volume: Array(300).fill(1000)
          };

          const signals = StrategyExecutor.executeStrategy(
            strategy.strategy_code, 
            sampleData, 
            strategy.reverse_signals
          );

          strategyTest.success = true;
          strategyTest.signals = signals;

          // Check if strategy generates proper directional signals
          const hasTradeDirection = signals.tradeDirection && signals.tradeDirection.some(dir => dir === 'BUY' || dir === 'SELL');
          const entrySignals = signals.entry.filter(Boolean).length;
          
          strategyAnalysis.hasDirectionalSignals = hasTradeDirection;
          strategyAnalysis.entrySignalCount = entrySignals;
          strategyAnalysis.lastSignalDirection = signals.tradeDirection ? signals.tradeDirection[signals.tradeDirection.length - 1] : 'NONE';

          console.log('✅ Strategy test successful:', {
            entrySignals,
            hasTradeDirection,
            lastDirection: strategyAnalysis.lastSignalDirection
          });

        } catch (error) {
          strategyTest.error = error.message;
          console.error('❌ Strategy test failed:', error);
        }
      }

      results.tests.strategy = strategyTest;

      // 3. Test OANDA configuration
      let oandaAnalysis = null;
      let oandaTest = { success: false, error: null, accountInfo: null };
      
      if (oandaConfig) {
        const config = JSON.parse(oandaConfig);
        oandaAnalysis = {
          accountId: config.accountId,
          environment: config.environment,
          hasApiKey: !!config.apiKey,
          apiKeyLength: config.apiKey?.length || 0
        };

        // Test OANDA connection
        try {
          const baseUrl = config.environment === 'practice' 
            ? 'https://api-fxpractice.oanda.com'
            : 'https://api-fxtrade.oanda.com';

          const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json',
            }
          });

          if (response.ok) {
            const data = await response.json();
            oandaTest.success = true;
            oandaTest.accountInfo = data.account;
            console.log('✅ OANDA connection successful');
          } else {
            const errorData = await response.json();
            oandaTest.error = `${response.status} - ${errorData.errorMessage || response.statusText}`;
            console.error('❌ OANDA connection failed:', oandaTest.error);
          }
        } catch (error) {
          oandaTest.error = error.message;
          console.error('❌ OANDA connection error:', error);
        }
      }

      results.tests.oanda = oandaTest;

      // 4. Check server sessions
      const activeSessions = await ServerForwardTestingService.getActiveSessions();
      console.log('🖥️ Server Sessions:', activeSessions);

      // 5. Check trading logs
      const tradingLogs = await ServerForwardTestingService.getTradingLogs();
      console.log('📊 Trading Logs:', tradingLogs);

      // 6. Analyze findings
      if (!selectedStrategy) {
        results.findings.push('❌ No strategy selected');
        results.recommendations.push('Select a strategy in the Strategy tab');
      } else if (!strategyTest.success) {
        results.findings.push(`❌ Strategy execution failed: ${strategyTest.error}`);
        results.recommendations.push('Fix strategy code errors before proceeding');
      } else if (!strategyAnalysis?.hasDirectionalSignals) {
        results.findings.push('❌ Strategy missing BUY/SELL directional signals');
        results.recommendations.push('Update strategy to include proper trade_direction logic');
      } else if (strategyAnalysis?.entrySignalCount === 0) {
        results.findings.push('⚠️ Strategy generates no entry signals with test data');
        results.recommendations.push('Check strategy conditions - they may be too restrictive');
      } else {
        results.findings.push(`✅ Strategy working: ${strategyAnalysis.entrySignalCount} signals generated`);
      }

      if (!oandaConfig) {
        results.findings.push('❌ OANDA configuration missing');
        results.recommendations.push('Configure OANDA credentials in Configuration tab');
      } else if (!oandaTest.success) {
        results.findings.push(`❌ OANDA connection failed: ${oandaTest.error}`);
        results.recommendations.push('Check OANDA credentials - token may be invalid or expired');
      } else {
        results.findings.push('✅ OANDA connection successful');
        results.findings.push(`💰 Account balance: ${oandaTest.accountInfo?.balance} ${oandaTest.accountInfo?.currency}`);
      }

      if (activeSessions.length === 0) {
        results.findings.push('❌ No autonomous trading sessions active on server');
        results.recommendations.push('Start forward testing to create server session');
      } else {
        results.findings.push(`✅ ${activeSessions.length} active server session(s) found`);
        
        // Check if sessions match current strategy
        const currentStrategyId = selectedStrategy ? JSON.parse(selectedStrategy).id : null;
        const matchingSessions = activeSessions.filter(s => s.strategy_id === currentStrategyId);
        
        if (matchingSessions.length === 0 && currentStrategyId) {
          results.findings.push('⚠️ Active sessions don\'t match current strategy');
          results.recommendations.push('Restart forward testing with current strategy');
        } else if (matchingSessions.length > 0) {
          results.findings.push('✅ Found matching sessions for current strategy');
        }
      }

      if (tradingLogs.length === 0) {
        results.findings.push('⚠️ No trading logs found');
        if (strategyAnalysis?.entrySignalCount === 0) {
          results.recommendations.push('Strategy not generating signals - check strategy logic');
        } else {
          results.recommendations.push('Wait for next execution cycle or check server logs');
        }
      } else {
        const recentLogs = tradingLogs.filter(log => 
          new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
        results.findings.push(`📊 ${tradingLogs.length} total logs, ${recentLogs.length} in last 24h`);
        
        const tradeLogs = tradingLogs.filter(log => log.log_type === 'trade');
        if (tradeLogs.length > 0) {
          results.findings.push(`💰 ${tradeLogs.length} trade executions logged`);
        }
      }

      // 7. Overall status determination
      if (strategyTest.success && oandaTest.success && activeSessions.length > 0 && strategyAnalysis?.hasDirectionalSignals) {
        results.status = 'working';
        results.findings.push('✅ All systems operational - forward testing should be working');
      } else if (strategyTest.success && oandaTest.success && strategyAnalysis?.hasDirectionalSignals) {
        results.status = 'ready';
        results.findings.push('✅ Ready to start forward testing');
      } else {
        results.status = 'not_working';
        results.findings.push('❌ Forward testing not operational - fix issues above');
      }

      results.data = {
        strategyAnalysis,
        oandaAnalysis,
        activeSessions,
        tradingLogs: tradingLogs.slice(0, 10),
        sessionCount: activeSessions.length,
        logCount: tradingLogs.length,
        tests: results.tests
      };

      setInvestigation(results);
      onDiagnosisComplete(results);

      toast({
        title: "Comprehensive Diagnosis Complete",
        description: `Status: ${results.status} - Found ${results.findings.length} findings`,
      });

    } catch (error) {
      console.error('Investigation error:', error);
      setInvestigation({
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Investigation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsInvestigating(false);
    }
  };

  useEffect(() => {
    runInvestigation();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'text-emerald-400';
      case 'ready': return 'text-blue-400';
      case 'not_working': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return CheckCircle;
      case 'ready': return Clock;
      case 'not_working': return XCircle;
      default: return Clock;
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Search className="h-5 w-5" />
          Comprehensive Forward Testing Diagnosis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-sm">
            Complete analysis of your forward testing setup and execution capability
          </p>
          <Button
            onClick={runInvestigation}
            disabled={isInvestigating}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            {isInvestigating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {isInvestigating ? 'Running Diagnosis...' : 'Run Full Diagnosis'}
          </Button>
        </div>

        {investigation && (
          <div className="space-y-4">
            {/* Status Summary */}
            {investigation.status && (
              <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                {React.createElement(getStatusIcon(investigation.status), {
                  className: `h-6 w-6 ${getStatusColor(investigation.status)}`
                })}
                <div>
                  <h3 className={`font-semibold ${getStatusColor(investigation.status)}`}>
                    {investigation.status === 'working' && 'Forward Testing is Working'}
                    {investigation.status === 'ready' && 'Ready to Start Forward Testing'}
                    {investigation.status === 'not_working' && 'Forward Testing Not Operational'}
                    {investigation.status === 'unknown' && 'Status Unknown'}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Last diagnosis: {new Date(investigation.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Test Results */}
            {investigation.data?.tests && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-700/30 p-3 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Strategy Test</h4>
                  {investigation.data.tests.strategy?.success ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-300 text-sm">Strategy execution successful</span>
                      </div>
                      <div className="text-slate-400 text-xs">
                        Signals: {investigation.data.strategyAnalysis?.entrySignalCount || 0} | 
                        Direction: {investigation.data.strategyAnalysis?.hasDirectionalSignals ? 'Yes' : 'No'}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <span className="text-red-300 text-sm">Strategy test failed</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-700/30 p-3 rounded-lg">
                  <h4 className="text-white font-medium mb-2">OANDA Test</h4>
                  {investigation.data.tests.oanda?.success ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-300 text-sm">Connection successful</span>
                      </div>
                      <div className="text-slate-400 text-xs">
                        Balance: {investigation.data.tests.oanda.accountInfo?.balance} {investigation.data.tests.oanda.accountInfo?.currency}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <span className="text-red-300 text-sm">Connection failed</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Findings */}
            {investigation.findings && investigation.findings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-white font-medium">Diagnostic Results:</h4>
                {investigation.findings.map((finding: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-slate-700/20 rounded">
                    <Activity className="h-4 w-4 mt-0.5 text-blue-400" />
                    <span className="text-slate-300 text-sm">{finding}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {investigation.recommendations && investigation.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-white font-medium">Action Items:</h4>
                {investigation.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded">
                    <Zap className="h-4 w-4 mt-0.5 text-amber-400" />
                    <span className="text-amber-300 text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Stats */}
            {investigation.data && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/30 p-3 rounded-lg text-center">
                  <div className="text-white font-semibold">{investigation.data.sessionCount || 0}</div>
                  <div className="text-slate-400 text-xs">Active Sessions</div>
                </div>
                <div className="bg-slate-700/30 p-3 rounded-lg text-center">
                  <div className="text-white font-semibold">{investigation.data.logCount || 0}</div>
                  <div className="text-slate-400 text-xs">Trading Logs</div>
                </div>
                <div className="bg-slate-700/30 p-3 rounded-lg text-center">
                  <div className="text-white font-semibold">
                    {investigation.data.strategyAnalysis?.name ? '✅' : '❌'}
                  </div>
                  <div className="text-slate-400 text-xs">Strategy</div>
                </div>
                <div className="bg-slate-700/30 p-3 rounded-lg text-center">
                  <div className="text-white font-semibold">
                    {investigation.data.oandaAnalysis?.hasApiKey ? '✅' : '❌'}
                  </div>
                  <div className="text-slate-400 text-xs">OANDA Config</div>
                </div>
              </div>
            )}

            {investigation.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">Error: {investigation.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ForwardTestingInvestigator;
