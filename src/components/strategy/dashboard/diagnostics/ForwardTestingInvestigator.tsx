
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Search, Activity, Clock, Zap, CheckCircle, XCircle } from 'lucide-react';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
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
      console.log('🔍 Starting Forward Testing Investigation...');
      
      const results: any = {
        timestamp: new Date().toISOString(),
        findings: [],
        recommendations: [],
        status: 'unknown'
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

      // 2. Check server sessions
      const activeSessions = await ServerForwardTestingService.getActiveSessions();
      console.log('🖥️ Server Sessions:', activeSessions);

      // 3. Check trading logs
      const tradingLogs = await ServerForwardTestingService.getTradingLogs();
      console.log('📊 Trading Logs:', tradingLogs);

      // 4. Parse and analyze strategy
      let strategyAnalysis = null;
      if (selectedStrategy) {
        const strategy = JSON.parse(selectedStrategy);
        strategyAnalysis = {
          name: strategy.strategy_name,
          symbol: strategy.symbol,
          hasCode: !!strategy.strategy_code,
          codeLength: strategy.strategy_code?.length || 0,
          reverseSignals: strategy.reverse_signals || false
        };

        // Check if strategy has proper signal direction logic
        const codeHasDirection = strategy.strategy_code?.includes('trade_direction') || 
                                strategy.strategy_code?.includes('BUY') || 
                                strategy.strategy_code?.includes('SELL');
        
        strategyAnalysis.hasDirectionalSignals = codeHasDirection;
      }

      // 5. Check OANDA configuration
      let oandaAnalysis = null;
      if (oandaConfig) {
        const config = JSON.parse(oandaConfig);
        oandaAnalysis = {
          accountId: config.accountId,
          environment: config.environment,
          hasApiKey: !!config.apiKey,
          apiKeyLength: config.apiKey?.length || 0
        };
      }

      // 6. Analyze findings
      if (!selectedStrategy) {
        results.findings.push('❌ No strategy selected');
        results.recommendations.push('Select a strategy in the Strategy tab');
      } else if (!strategyAnalysis?.hasDirectionalSignals) {
        results.findings.push('⚠️ Strategy missing directional signals (BUY/SELL)');
        results.recommendations.push('Load the fixed strategy that includes trade_direction signals');
      }

      if (!oandaConfig) {
        results.findings.push('❌ OANDA configuration missing');
        results.recommendations.push('Configure OANDA credentials in Configuration tab');
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
        }
      }

      if (tradingLogs.length === 0) {
        results.findings.push('⚠️ No trading logs found');
        results.recommendations.push('Check if strategy is generating signals');
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
      if (activeSessions.length > 0 && tradingLogs.length > 0) {
        results.status = 'working';
        results.findings.push('✅ Forward testing appears to be working');
      } else if (activeSessions.length > 0 && tradingLogs.length === 0) {
        results.status = 'partial';
        results.findings.push('⚠️ Sessions active but no trades - strategy may not be generating signals');
      } else {
        results.status = 'not_working';
        results.findings.push('❌ Forward testing not properly active');
      }

      results.data = {
        strategyAnalysis,
        oandaAnalysis,
        activeSessions,
        tradingLogs: tradingLogs.slice(0, 10), // Last 10 logs
        sessionCount: activeSessions.length,
        logCount: tradingLogs.length
      };

      setInvestigation(results);
      onDiagnosisComplete(results);

      toast({
        title: "Investigation Complete",
        description: `Found ${results.findings.length} findings and ${results.recommendations.length} recommendations`,
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
      case 'partial': return 'text-yellow-400';
      case 'not_working': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return CheckCircle;
      case 'partial': return AlertTriangle;
      case 'not_working': return XCircle;
      default: return Clock;
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Search className="h-5 w-5" />
          Forward Testing Investigation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-sm">
            Analyzing why your forward testing isn't executing trades properly
          </p>
          <Button
            onClick={runInvestigation}
            disabled={isInvestigating}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            <Search className="h-4 w-4 mr-2" />
            {isInvestigating ? 'Investigating...' : 'Re-investigate'}
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
                    {investigation.status === 'partial' && 'Partial Forward Testing Activity'}
                    {investigation.status === 'not_working' && 'Forward Testing Not Active'}
                    {investigation.status === 'unknown' && 'Status Unknown'}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Last checked: {new Date(investigation.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Findings */}
            {investigation.findings && investigation.findings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-white font-medium">Key Findings:</h4>
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
                <h4 className="text-white font-medium">Recommendations:</h4>
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
