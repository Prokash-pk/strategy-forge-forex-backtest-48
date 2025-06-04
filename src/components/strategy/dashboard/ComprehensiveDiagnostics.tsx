
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Search, Database, Activity, Clock, Server, Wifi, User, Settings, Zap } from 'lucide-react';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DiagnosticResult {
  name: string;
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  message: string;
  details?: any;
  icon: React.ReactNode;
  category: 'auth' | 'config' | 'forward_testing' | 'connectivity';
}

const ComprehensiveDiagnostics: React.FC = () => {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runFullDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    try {
      // 1. Authentication Check
      console.log('🔍 Checking Authentication...');
      if (user) {
        results.push({
          name: 'Authentication',
          status: 'SUCCESS',
          message: `Authenticated as ${user.email}`,
          details: { userId: user.id, email: user.email },
          icon: <User className="h-4 w-4" />,
          category: 'auth'
        });
      } else {
        results.push({
          name: 'Authentication',
          status: 'ERROR',
          message: 'User not authenticated',
          icon: <User className="h-4 w-4" />,
          category: 'auth'
        });
      }

      // 2. Strategy Config Check
      console.log('🔍 Checking Strategy Config...');
      const selectedStrategy = localStorage.getItem('selected_strategy_settings');
      if (selectedStrategy) {
        const parsedStrategy = JSON.parse(selectedStrategy);
        results.push({
          name: 'Strategy Config',
          status: 'SUCCESS',
          message: `Strategy selected: ${parsedStrategy.strategy_name}`,
          details: parsedStrategy,
          icon: <Settings className="h-4 w-4" />,
          category: 'config'
        });
      } else {
        results.push({
          name: 'Strategy Config',
          status: 'ERROR',
          message: 'No strategy selected',
          icon: <Settings className="h-4 w-4" />,
          category: 'config'
        });
      }

      // 3. OANDA Config Check
      console.log('🔍 Checking OANDA Config...');
      const oandaConfig = localStorage.getItem('oanda_config');
      if (oandaConfig) {
        const parsedConfig = JSON.parse(oandaConfig);
        if (parsedConfig.accountId && parsedConfig.apiKey) {
          results.push({
            name: 'Oanda Config',
            status: 'SUCCESS',
            message: `OANDA account configured: ${parsedConfig.accountId} (${parsedConfig.environment})`,
            details: { 
              accountId: parsedConfig.accountId, 
              environment: parsedConfig.environment,
              hasApiKey: !!parsedConfig.apiKey 
            },
            icon: <Settings className="h-4 w-4" />,
            category: 'config'
          });
        } else {
          results.push({
            name: 'Oanda Config',
            status: 'ERROR',
            message: 'OANDA config incomplete (missing credentials)',
            details: parsedConfig,
            icon: <Settings className="h-4 w-4" />,
            category: 'config'
          });
        }
      } else {
        results.push({
          name: 'Oanda Config',
          status: 'ERROR',
          message: 'No OANDA config found',
          icon: <Settings className="h-4 w-4" />,
          category: 'config'
        });
      }

      // 4. OANDA Connectivity Check
      console.log('🔍 Checking OANDA Connectivity...');
      if (oandaConfig) {
        const parsedConfig = JSON.parse(oandaConfig);
        if (parsedConfig.accountId && parsedConfig.apiKey) {
          try {
            const baseUrl = parsedConfig.environment === 'practice' 
              ? 'https://api-fxpractice.oanda.com'
              : 'https://api-fxtrade.oanda.com';

            const response = await fetch(`${baseUrl}/v3/accounts/${parsedConfig.accountId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${parsedConfig.apiKey}`,
                'Content-Type': 'application/json',
              }
            });

            if (response.ok) {
              const data = await response.json();
              results.push({
                name: 'Oanda Connectivity',
                status: 'SUCCESS',
                message: `OANDA connection successful - Account: ${data.account?.alias || parsedConfig.accountId}`,
                details: { accountData: data.account },
                icon: <Wifi className="h-4 w-4" />,
                category: 'connectivity'
              });
            } else {
              const errorData = await response.json();
              results.push({
                name: 'Oanda Connectivity',
                status: 'ERROR',
                message: `OANDA connection failed: ${response.status} - ${errorData.errorMessage || response.statusText}`,
                details: { status: response.status, error: errorData },
                icon: <Wifi className="h-4 w-4" />,
                category: 'connectivity'
              });
            }
          } catch (error) {
            results.push({
              name: 'Oanda Connectivity',
              status: 'ERROR',
              message: `OANDA connectivity test failed: ${error.message}`,
              details: { error: error.message },
              icon: <Wifi className="h-4 w-4" />,
              category: 'connectivity'
            });
          }
        } else {
          results.push({
            name: 'Oanda Connectivity',
            status: 'ERROR',
            message: 'No OANDA credentials to test',
            icon: <Wifi className="h-4 w-4" />,
            category: 'connectivity'
          });
        }
      } else {
        results.push({
          name: 'Oanda Connectivity',
          status: 'ERROR',
          message: 'No OANDA config found for connectivity test',
          icon: <Wifi className="h-4 w-4" />,
          category: 'connectivity'
        });
      }

      // 5. Forward Testing Flag Check
      console.log('🔍 Checking Forward Testing Flag...');
      const forwardTestingFlag = localStorage.getItem('forward_testing_active');
      if (forwardTestingFlag === 'true') {
        results.push({
          name: 'Forward Testing Flag',
          status: 'SUCCESS',
          message: 'Local flag: active',
          details: { flag: forwardTestingFlag },
          icon: <Zap className="h-4 w-4" />,
          category: 'forward_testing'
        });
      } else if (forwardTestingFlag === 'false') {
        results.push({
          name: 'Forward Testing Flag',
          status: 'WARNING',
          message: 'Local flag: inactive',
          details: { flag: forwardTestingFlag },
          icon: <Zap className="h-4 w-4" />,
          category: 'forward_testing'
        });
      } else {
        results.push({
          name: 'Forward Testing Flag',
          status: 'WARNING',
          message: 'Local flag: null',
          details: { flag: forwardTestingFlag },
          icon: <Zap className="h-4 w-4" />,
          category: 'forward_testing'
        });
      }

      // 6. Server Sessions Check
      console.log('🔍 Checking Server Sessions...');
      try {
        const activeSessions = await ServerForwardTestingService.getActiveSessions();
        if (activeSessions.length > 0) {
          results.push({
            name: 'Server Sessions',
            status: 'SUCCESS',
            message: `Found ${activeSessions.length} active server sessions`,
            details: activeSessions,
            icon: <Server className="h-4 w-4" />,
            category: 'forward_testing'
          });
        } else {
          results.push({
            name: 'Server Sessions',
            status: 'WARNING',
            message: 'No active server sessions found',
            details: activeSessions,
            icon: <Server className="h-4 w-4" />,
            category: 'forward_testing'
          });
        }
      } catch (error) {
        results.push({
          name: 'Server Sessions',
          status: 'ERROR',
          message: `Failed to check server sessions: ${error.message}`,
          details: { error: error.message },
          icon: <Server className="h-4 w-4" />,
          category: 'forward_testing'
        });
      }

      // 7. Server Logs Check
      console.log('🔍 Checking Server Logs...');
      try {
        const tradingLogs = await ServerForwardTestingService.getTradingLogs();
        if (tradingLogs.length > 0) {
          results.push({
            name: 'Server Logs',
            status: 'SUCCESS',
            message: `Found ${tradingLogs.length} server trading logs`,
            details: tradingLogs.slice(0, 5), // Show first 5 logs
            icon: <Database className="h-4 w-4" />,
            category: 'forward_testing'
          });
        } else {
          results.push({
            name: 'Server Logs',
            status: 'WARNING',
            message: 'Found 0 server trading logs',
            details: [],
            icon: <Database className="h-4 w-4" />,
            category: 'forward_testing'
          });
        }
      } catch (error) {
        results.push({
          name: 'Server Logs',
          status: 'ERROR',
          message: `Failed to check server logs: ${error.message}`,
          details: { error: error.message },
          icon: <Database className="h-4 w-4" />,
          category: 'forward_testing'
        });
      }

      // 8. Database Sessions Check
      console.log('🔍 Checking Database Sessions...');
      if (user) {
        try {
          const { data: dbSessions, error } = await supabase
            .from('trading_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true);

          if (error) throw error;

          if (dbSessions && dbSessions.length > 0) {
            results.push({
              name: 'Database Sessions',
              status: 'SUCCESS',
              message: `Found ${dbSessions.length} active database sessions`,
              details: dbSessions,
              icon: <Database className="h-4 w-4" />,
              category: 'forward_testing'
            });
          } else {
            results.push({
              name: 'Database Sessions',
              status: 'WARNING',
              message: 'No active database sessions found',
              details: [],
              icon: <Database className="h-4 w-4" />,
              category: 'forward_testing'
            });
          }
        } catch (error) {
          results.push({
            name: 'Database Sessions',
            status: 'ERROR',
            message: `Database query failed: ${error.message}`,
            details: { error: error.message },
            icon: <Database className="h-4 w-4" />,
            category: 'forward_testing'
          });
        }
      } else {
        results.push({
          name: 'Database Sessions',
          status: 'ERROR',
          message: 'Cannot check database sessions - user not authenticated',
          icon: <Database className="h-4 w-4" />,
          category: 'forward_testing'
        });
      }

      // 9. Edge Functions Check
      console.log('🔍 Checking Edge Functions...');
      try {
        const { data, error } = await supabase.functions.invoke('oanda-forward-testing', {
          body: { action: 'ping' }
        });

        if (error) {
          results.push({
            name: 'Edge Functions',
            status: 'ERROR',
            message: `Edge function error: ${error.message}`,
            details: { error: error.message },
            icon: <Activity className="h-4 w-4" />,
            category: 'forward_testing'
          });
        } else {
          results.push({
            name: 'Edge Functions',
            status: 'SUCCESS',
            message: 'Edge functions responding correctly',
            details: data,
            icon: <Activity className="h-4 w-4" />,
            category: 'forward_testing'
          });
        }
      } catch (error) {
        results.push({
          name: 'Edge Functions',
          status: 'ERROR',
          message: `Edge function error: ${error.message}`,
          details: { error: error.message },
          icon: <Activity className="h-4 w-4" />,
          category: 'forward_testing'
        });
      }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'WARNING': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'ERROR': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'ERROR': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const successCount = diagnostics.filter(d => d.status === 'SUCCESS').length;
  const warningCount = diagnostics.filter(d => d.status === 'WARNING').length;
  const errorCount = diagnostics.filter(d => d.status === 'ERROR').length;

  // Group diagnostics by category
  const groupedDiagnostics = {
    auth: diagnostics.filter(d => d.category === 'auth'),
    config: diagnostics.filter(d => d.category === 'config'),
    connectivity: diagnostics.filter(d => d.category === 'connectivity'),
    forward_testing: diagnostics.filter(d => d.category === 'forward_testing')
  };

  const renderDiagnosticSection = (title: string, items: DiagnosticResult[]) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-600 pb-1">
          {title}
        </h4>
        {items.map((diagnostic, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getStatusColor(diagnostic.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {diagnostic.icon}
                <span className="font-medium">{diagnostic.name}</span>
              </div>
              {getStatusIcon(diagnostic.status)}
            </div>
            <p className="text-sm mb-2">{diagnostic.message}</p>
            
            {diagnostic.details && (
              <details className="text-xs">
                <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
                  View Details
                </summary>
                <pre className="mt-2 p-2 bg-slate-800/50 rounded text-xs overflow-auto">
                  {JSON.stringify(diagnostic.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-slate-800 border-slate-700 w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            Comprehensive System Diagnostics
          </div>
          <Button
            onClick={runFullDiagnostics}
            disabled={isRunning}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            <Search className="h-4 w-4 mr-2" />
            {isRunning ? 'Running...' : 'Re-run'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="flex gap-4 mb-6">
          <Badge variant="default" className="bg-emerald-600">
            {successCount} Success
          </Badge>
          <Badge variant="secondary" className="bg-yellow-600">
            {warningCount} Warning
          </Badge>
          <Badge variant="destructive">
            {errorCount} Error
          </Badge>
        </div>

        {/* Diagnostic Results - Organized by category */}
        {renderDiagnosticSection('Authentication & User', groupedDiagnostics.auth)}
        {renderDiagnosticSection('Configuration', groupedDiagnostics.config)}
        {renderDiagnosticSection('Connectivity', groupedDiagnostics.connectivity)}
        {renderDiagnosticSection('Forward Testing Investigation', groupedDiagnostics.forward_testing)}

        {diagnostics.length === 0 && !isRunning && (
          <div className="text-center py-8 text-slate-400">
            <Search className="h-8 w-8 mx-auto mb-2" />
            <p>No diagnostics data available</p>
          </div>
        )}

        {isRunning && (
          <div className="text-center py-8 text-slate-400">
            <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p>Running comprehensive diagnostics...</p>
          </div>
        )}

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
