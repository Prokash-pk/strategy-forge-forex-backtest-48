
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Search, Database, Activity, Clock, Server, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { supabase } from '@/integrations/supabase/client';

interface TradingDiagnosticsProps {
  strategy: any;
}

interface DiagnosticCheck {
  status: 'success' | 'warning' | 'error';
  details: string;
  [key: string]: any;
}

interface DiagnosticResults {
  timestamp: string;
  checks: {
    authentication?: DiagnosticCheck;
    strategyConfig?: DiagnosticCheck;
    oandaConfig?: DiagnosticCheck;
    forwardTestingFlag?: DiagnosticCheck;
    serverSessions?: DiagnosticCheck;
    serverLogs?: DiagnosticCheck;
    databaseSessions?: DiagnosticCheck;
    oandaConnectivity?: DiagnosticCheck;
    edgeFunctions?: DiagnosticCheck;
  };
  issues: string[];
  recommendations: string[];
  rootCause?: {
    primaryIssue: string;
    description: string;
    severity: string;
    action: string;
  };
}

const TradingDiagnostics: React.FC<TradingDiagnosticsProps> = ({ strategy }) => {
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [comprehensiveResults, setComprehensiveResults] = useState<DiagnosticResults | null>(null);

  const runComprehensiveDiagnostics = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Running COMPREHENSIVE Forward Testing Diagnosis...');
      
      const results: DiagnosticResults = {
        timestamp: new Date().toISOString(),
        checks: {},
        issues: [],
        recommendations: []
      };

      // 1. Check Authentication
      console.log('1️⃣ Checking Authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      results.checks.authentication = {
        status: user ? 'success' : 'error',
        details: user ? `Authenticated as ${user.email}` : 'Not authenticated',
        userId: user?.id || null,
        error: authError?.message || null
      };
      if (!user) results.issues.push('User not authenticated - this is required for forward testing');

      // 2. Check Strategy Configuration
      console.log('2️⃣ Checking Strategy Configuration...');
      const selectedStrategy = localStorage.getItem('selected_strategy_settings');
      const parsedStrategy = selectedStrategy ? JSON.parse(selectedStrategy) : null;
      results.checks.strategyConfig = {
        status: parsedStrategy ? 'success' : 'error',
        details: parsedStrategy ? `Strategy: ${parsedStrategy.strategy_name}` : 'No strategy selected',
        strategyId: parsedStrategy?.id || null,
        strategyName: parsedStrategy?.strategy_name || null,
        hasCode: parsedStrategy?.strategy_code ? parsedStrategy.strategy_code.length > 0 : false
      };
      if (!parsedStrategy) results.issues.push('No strategy selected for forward testing');

      // 3. Check OANDA Configuration
      console.log('3️⃣ Checking OANDA Configuration...');
      const oandaConfig = localStorage.getItem('oanda_config');
      const parsedOandaConfig = oandaConfig ? JSON.parse(oandaConfig) : null;
      results.checks.oandaConfig = {
        status: (parsedOandaConfig?.accountId && parsedOandaConfig?.apiKey) ? 'success' : 'error',
        details: parsedOandaConfig ? `Account: ${parsedOandaConfig.accountId} (${parsedOandaConfig.environment})` : 'No OANDA config found',
        hasCredentials: !!(parsedOandaConfig?.accountId && parsedOandaConfig?.apiKey),
        environment: parsedOandaConfig?.environment || null
      };
      if (!parsedOandaConfig?.accountId || !parsedOandaConfig?.apiKey) {
        results.issues.push('OANDA credentials not configured properly');
      }

      // 4. Check Forward Testing Active Flag
      console.log('4️⃣ Checking Forward Testing Status...');
      const forwardTestingActive = localStorage.getItem('forward_testing_active');
      results.checks.forwardTestingFlag = {
        status: forwardTestingActive === 'true' ? 'success' : 'warning',
        details: `Local flag: ${forwardTestingActive}`,
        isActive: forwardTestingActive === 'true'
      };

      // 5. Check Server-Side Trading Sessions
      console.log('5️⃣ Checking Server Trading Sessions...');
      try {
        const activeSessions = await ServerForwardTestingService.getActiveSessions();
        results.checks.serverSessions = {
          status: activeSessions?.length > 0 ? 'success' : 'error',
          details: `Found ${activeSessions?.length || 0} active server sessions`,
          sessions: activeSessions || [],
          count: activeSessions?.length || 0
        };
        if (!activeSessions || activeSessions.length === 0) {
          results.issues.push('No active server-side trading sessions found');
          results.recommendations.push('Try stopping and restarting forward testing to create server sessions');
        }
      } catch (error: any) {
        results.checks.serverSessions = {
          status: 'error',
          details: `Error checking sessions: ${error.message}`,
          error: error.message
        };
        results.issues.push('Failed to check server sessions - this indicates a backend issue');
      }

      // 6. Check Server Trading Logs
      console.log('6️⃣ Checking Server Trading Logs...');
      try {
        const tradingLogs = await ServerForwardTestingService.getTradingLogs();
        results.checks.serverLogs = {
          status: tradingLogs?.length > 0 ? 'success' : 'warning',
          details: `Found ${tradingLogs?.length || 0} server trading logs`,
          logs: tradingLogs || [],
          count: tradingLogs?.length || 0,
          recentLogs: tradingLogs?.slice(0, 5) || []
        };
        if (!tradingLogs || tradingLogs.length === 0) {
          results.recommendations.push('No server trading activity detected - strategy may not be generating signals yet');
        }
      } catch (error: any) {
        results.checks.serverLogs = {
          status: 'error',
          details: `Error checking logs: ${error.message}`,
          error: error.message
        };
      }

      // 7. Check Database Trading Sessions Table
      console.log('7️⃣ Checking Database Trading Sessions...');
      if (user) {
        try {
          const { data: dbSessions, error: dbError } = await supabase
            .from('trading_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true);
          
          results.checks.databaseSessions = {
            status: dbSessions?.length > 0 ? 'success' : 'error',
            details: `Found ${dbSessions?.length || 0} active database sessions`,
            sessions: dbSessions || [],
            count: dbSessions?.length || 0,
            error: dbError?.message || null
          };
          if (!dbSessions || dbSessions.length === 0) {
            results.issues.push('No active trading sessions in database');
          }
        } catch (error: any) {
          results.checks.databaseSessions = {
            status: 'error',
            details: `Database error: ${error.message}`,
            error: error.message
          };
        }
      }

      // 8. Check OANDA API Connectivity
      console.log('8️⃣ Testing OANDA API Connectivity...');
      if (parsedOandaConfig?.accountId && parsedOandaConfig?.apiKey) {
        try {
          const baseUrl = parsedOandaConfig.environment === 'practice' 
            ? 'https://api-fxpractice.oanda.com'
            : 'https://api-fxtrade.oanda.com';
          
          const response = await fetch(`${baseUrl}/v3/accounts/${parsedOandaConfig.accountId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${parsedOandaConfig.apiKey}`,
              'Content-Type': 'application/json',
            }
          });

          results.checks.oandaConnectivity = {
            status: response.ok ? 'success' : 'error',
            details: response.ok ? 'OANDA API connection successful' : `HTTP ${response.status}: ${response.statusText}`,
            httpStatus: response.status
          };
          if (!response.ok) {
            results.issues.push('OANDA API connection failed - check credentials');
          }
        } catch (error: any) {
          results.checks.oandaConnectivity = {
            status: 'error',
            details: `Connection error: ${error.message}`,
            error: error.message
          };
          results.issues.push('Cannot connect to OANDA API');
        }
      } else {
        results.checks.oandaConnectivity = {
          status: 'error',
          details: 'No OANDA credentials to test',
        };
      }

      // 9. Check Edge Function Accessibility
      console.log('9️⃣ Testing Edge Functions...');
      try {
        const { data: edgeFunctionTest, error: edgeError } = await supabase.functions.invoke('oanda-forward-testing', {
          body: { action: 'test' }
        });
        
        results.checks.edgeFunctions = {
          status: !edgeError ? 'success' : 'error',
          details: !edgeError ? 'Edge functions accessible' : `Edge function error: ${edgeError.message}`,
          error: edgeError?.message || null
        };
        if (edgeError) {
          results.issues.push('Edge functions not accessible - this prevents autonomous trading');
        }
      } catch (error: any) {
        results.checks.edgeFunctions = {
          status: 'error',
          details: `Edge function test failed: ${error.message}`,
          error: error.message
        };
      }

      // 10. Analyze Root Cause
      console.log('🔟 Analyzing Root Cause...');
      results.rootCause = analyzeRootCause(results);
      
      setComprehensiveResults(results);
      console.log('📊 Comprehensive Diagnosis Complete:', results);
      
    } catch (error: any) {
      console.error('Diagnostics error:', error);
      setComprehensiveResults({
        error: error.message,
        timestamp: new Date().toISOString(),
        checks: {},
        issues: [],
        recommendations: []
      } as any);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeRootCause = (results: DiagnosticResults) => {
    const issues = results.issues;
    
    if (issues.includes('User not authenticated')) {
      return {
        primaryIssue: 'Authentication Required',
        description: 'User must be logged in for forward testing to work',
        severity: 'critical',
        action: 'Please log in to your account'
      };
    }
    
    if (issues.includes('OANDA credentials not configured properly')) {
      return {
        primaryIssue: 'OANDA Configuration Missing',
        description: 'Valid OANDA Account ID and API Key are required',
        severity: 'critical',
        action: 'Configure OANDA credentials in the Configuration tab'
      };
    }
    
    if (issues.includes('No strategy selected for forward testing')) {
      return {
        primaryIssue: 'Strategy Not Selected',
        description: 'A strategy must be selected before starting forward testing',
        severity: 'critical',
        action: 'Select a strategy in the Strategy tab'
      };
    }
    
    if (issues.includes('No active server-side trading sessions found')) {
      return {
        primaryIssue: 'Server Sessions Not Started',
        description: 'Autonomous trading sessions are not running on the server',
        severity: 'high',
        action: 'Start forward testing from the Control tab'
      };
    }
    
    if (issues.includes('OANDA API connection failed - check credentials')) {
      return {
        primaryIssue: 'OANDA API Connection Failed',
        description: 'Cannot connect to OANDA with provided credentials',
        severity: 'high',
        action: 'Verify OANDA credentials and test connection'
      };
    }
    
    if (issues.includes('Edge functions not accessible - this prevents autonomous trading')) {
      return {
        primaryIssue: 'Backend Services Unavailable',
        description: 'Server-side trading functions are not accessible',
        severity: 'high',
        action: 'This is a system issue - please contact support'
      };
    }
    
    if (issues.length === 0) {
      return {
        primaryIssue: 'System Appears Configured',
        description: 'All checks passed - forward testing should be working',
        severity: 'info',
        action: 'Monitor for trading activity or check strategy signal generation'
      };
    }
    
    return {
      primaryIssue: 'Multiple Configuration Issues',
      description: `${issues.length} issues detected`,
      severity: 'high',
      action: 'Review and fix all identified issues'
    };
  };

  // Auto-run comprehensive diagnostics on mount
  useEffect(() => {
    runComprehensiveDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700 w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base">
          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          Comprehensive Forward Testing Diagnosis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-sm">
            Full system analysis to diagnose why 226 backtest trades aren't executing live
          </p>
          <Button
            onClick={runComprehensiveDiagnostics}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Analyzing...' : 'Re-run Full Diagnosis'}
          </Button>
        </div>

        {comprehensiveResults && (
          <div className="space-y-6">
            
            {/* Root Cause Analysis */}
            {comprehensiveResults.rootCause && (
              <div className={`p-4 rounded-lg border ${
                comprehensiveResults.rootCause.severity === 'critical' ? 'bg-red-500/10 border-red-500/20' :
                comprehensiveResults.rootCause.severity === 'high' ? 'bg-orange-500/10 border-orange-500/20' :
                comprehensiveResults.rootCause.severity === 'info' ? 'bg-blue-500/10 border-blue-500/20' :
                'bg-yellow-500/10 border-yellow-500/20'
              }`}>
                <h3 className={`text-lg font-bold mb-2 ${
                  comprehensiveResults.rootCause.severity === 'critical' ? 'text-red-400' :
                  comprehensiveResults.rootCause.severity === 'high' ? 'text-orange-400' :
                  comprehensiveResults.rootCause.severity === 'info' ? 'text-blue-400' :
                  'text-yellow-400'
                }`}>
                  🎯 Root Cause: {comprehensiveResults.rootCause.primaryIssue}
                </h3>
                <p className="text-slate-300 mb-2">{comprehensiveResults.rootCause.description}</p>
                <p className="text-white font-medium">
                  ➡️ Action Required: {comprehensiveResults.rootCause.action}
                </p>
              </div>
            )}

            {/* System Checks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comprehensiveResults.checks && Object.entries(comprehensiveResults.checks).map(([checkName, check]: [string, any]) => (
                <div key={checkName} className="p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(check.status)}
                    <span className="text-white text-sm font-medium capitalize">
                      {checkName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </div>
                  <Badge variant={check.status === 'success' ? "default" : check.status === 'warning' ? "secondary" : "destructive"} className="mb-2">
                    {check.status.toUpperCase()}
                  </Badge>
                  <p className="text-xs text-slate-400">
                    {check.details}
                  </p>
                  {check.error && (
                    <p className="text-xs text-red-400 mt-1">
                      Error: {check.error}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Issues Summary */}
            {comprehensiveResults.issues?.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Issues Detected ({comprehensiveResults.issues.length})
                </h4>
                <ul className="space-y-1">
                  {comprehensiveResults.issues.map((issue, index) => (
                    <li key={index} className="text-red-300 text-sm">
                      • {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {comprehensiveResults.recommendations?.length > 0 && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-blue-400 font-medium mb-2">
                  💡 Recommendations
                </h4>
                <ul className="space-y-1">
                  {comprehensiveResults.recommendations.map((rec, index) => (
                    <li key={index} className="text-blue-300 text-sm">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Server Session Details */}
            {comprehensiveResults.checks?.serverSessions?.sessions?.length > 0 && (
              <div className="p-4 bg-slate-700/30 rounded-lg">
                <h4 className="text-white text-sm font-medium mb-2">Server Trading Sessions</h4>
                <div className="space-y-2">
                  {comprehensiveResults.checks.serverSessions.sessions.map((session: any, index: number) => (
                    <div key={index} className="text-xs p-2 bg-slate-600/50 rounded">
                      <p className="text-slate-300">
                        Strategy: {session.strategy_name || session.strategy_id}
                      </p>
                      <p className="text-slate-400">
                        Symbol: {session.symbol} | Environment: {session.environment}
                      </p>
                      <p className="text-slate-400">
                        Last Execution: {new Date(session.last_execution).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Server Logs */}
            {comprehensiveResults.checks?.serverLogs?.recentLogs?.length > 0 && (
              <div className="p-4 bg-slate-700/30 rounded-lg">
                <h4 className="text-white text-sm font-medium mb-2">Recent Server Activity</h4>
                <div className="space-y-1">
                  {comprehensiveResults.checks.serverLogs.recentLogs.map((log: any, index: number) => (
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

            <div className="text-xs text-slate-500 pt-2 border-t border-slate-600">
              Last diagnosis: {new Date(comprehensiveResults.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingDiagnostics;
