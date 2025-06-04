
import { DiagnosticResult } from './types';
import { User, Settings, Wifi, Zap, Server, Database, Activity } from 'lucide-react';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { supabase } from '@/integrations/supabase/client';

export const runAuthenticationCheck = (user: any): DiagnosticResult => {
  console.log('🔍 Checking Authentication...');
  if (user) {
    return {
      name: 'Authentication',
      status: 'SUCCESS',
      message: `Authenticated as ${user.email}`,
      details: { userId: user.id, email: user.email },
      icon: <User className="h-4 w-4" />,
      category: 'auth'
    };
  } else {
    return {
      name: 'Authentication',
      status: 'ERROR',
      message: 'User not authenticated',
      icon: <User className="h-4 w-4" />,
      category: 'auth'
    };
  }
};

export const runStrategyConfigCheck = (): DiagnosticResult => {
  console.log('🔍 Checking Strategy Config...');
  const selectedStrategy = localStorage.getItem('selected_strategy_settings');
  if (selectedStrategy) {
    const parsedStrategy = JSON.parse(selectedStrategy);
    return {
      name: 'Strategy Config',
      status: 'SUCCESS',
      message: `Strategy selected: ${parsedStrategy.strategy_name}`,
      details: parsedStrategy,
      icon: <Settings className="h-4 w-4" />,
      category: 'config'
    };
  } else {
    return {
      name: 'Strategy Config',
      status: 'ERROR',
      message: 'No strategy selected',
      icon: <Settings className="h-4 w-4" />,
      category: 'config'
    };
  }
};

export const runOandaConfigCheck = (): DiagnosticResult => {
  console.log('🔍 Checking OANDA Config...');
  const oandaConfig = localStorage.getItem('oanda_config');
  if (oandaConfig) {
    const parsedConfig = JSON.parse(oandaConfig);
    if (parsedConfig.accountId && parsedConfig.apiKey) {
      return {
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
      };
    } else {
      return {
        name: 'Oanda Config',
        status: 'ERROR',
        message: 'OANDA config incomplete (missing credentials)',
        details: parsedConfig,
        icon: <Settings className="h-4 w-4" />,
        category: 'config'
      };
    }
  } else {
    return {
      name: 'Oanda Config',
      status: 'ERROR',
      message: 'No OANDA config found',
      icon: <Settings className="h-4 w-4" />,
      category: 'config'
    };
  }
};

export const runOandaConnectivityCheck = async (): Promise<DiagnosticResult> => {
  console.log('🔍 Checking OANDA Connectivity...');
  const oandaConfig = localStorage.getItem('oanda_config');
  
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
          return {
            name: 'Oanda Connectivity',
            status: 'SUCCESS',
            message: `OANDA connection successful - Account: ${data.account?.alias || parsedConfig.accountId}`,
            details: { accountData: data.account },
            icon: <Wifi className="h-4 w-4" />,
            category: 'connectivity'
          };
        } else {
          const errorData = await response.json();
          return {
            name: 'Oanda Connectivity',
            status: 'ERROR',
            message: `OANDA connection failed: ${response.status} - ${errorData.errorMessage || response.statusText}`,
            details: { status: response.status, error: errorData },
            icon: <Wifi className="h-4 w-4" />,
            category: 'connectivity'
          };
        }
      } catch (error) {
        return {
          name: 'Oanda Connectivity',
          status: 'ERROR',
          message: `OANDA connectivity test failed: ${error.message}`,
          details: { error: error.message },
          icon: <Wifi className="h-4 w-4" />,
          category: 'connectivity'
        };
      }
    } else {
      return {
        name: 'Oanda Connectivity',
        status: 'ERROR',
        message: 'No OANDA credentials to test',
        icon: <Wifi className="h-4 w-4" />,
        category: 'connectivity'
      };
    }
  } else {
    return {
      name: 'Oanda Connectivity',
      status: 'ERROR',
      message: 'No OANDA config found for connectivity test',
      icon: <Wifi className="h-4 w-4" />,
      category: 'connectivity'
    };
  }
};

export const runForwardTestingFlagCheck = (): DiagnosticResult => {
  console.log('🔍 Checking Forward Testing Flag...');
  const forwardTestingFlag = localStorage.getItem('forward_testing_active');
  if (forwardTestingFlag === 'true') {
    return {
      name: 'Forward Testing Flag',
      status: 'SUCCESS',
      message: 'Local flag: active',
      details: { flag: forwardTestingFlag },
      icon: <Zap className="h-4 w-4" />,
      category: 'forward_testing'
    };
  } else if (forwardTestingFlag === 'false') {
    return {
      name: 'Forward Testing Flag',
      status: 'WARNING',
      message: 'Local flag: inactive',
      details: { flag: forwardTestingFlag },
      icon: <Zap className="h-4 w-4" />,
      category: 'forward_testing'
    };
  } else {
    return {
      name: 'Forward Testing Flag',
      status: 'WARNING',
      message: 'Local flag: null',
      details: { flag: forwardTestingFlag },
      icon: <Zap className="h-4 w-4" />,
      category: 'forward_testing'
    };
  }
};

export const runServerSessionsCheck = async (): Promise<DiagnosticResult> => {
  console.log('🔍 Checking Server Sessions...');
  try {
    const activeSessions = await ServerForwardTestingService.getActiveSessions();
    if (activeSessions.length > 0) {
      return {
        name: 'Server Sessions',
        status: 'SUCCESS',
        message: `Found ${activeSessions.length} active server sessions`,
        details: activeSessions,
        icon: <Server className="h-4 w-4" />,
        category: 'forward_testing'
      };
    } else {
      return {
        name: 'Server Sessions',
        status: 'WARNING',
        message: 'No active server sessions found',
        details: activeSessions,
        icon: <Server className="h-4 w-4" />,
        category: 'forward_testing'
      };
    }
  } catch (error) {
    return {
      name: 'Server Sessions',
      status: 'ERROR',
      message: `Failed to check server sessions: ${error.message}`,
      details: { error: error.message },
      icon: <Server className="h-4 w-4" />,
      category: 'forward_testing'
    };
  }
};

export const runServerLogsCheck = async (): Promise<DiagnosticResult> => {
  console.log('🔍 Checking Server Logs...');
  try {
    const tradingLogs = await ServerForwardTestingService.getTradingLogs();
    if (tradingLogs.length > 0) {
      return {
        name: 'Server Logs',
        status: 'SUCCESS',
        message: `Found ${tradingLogs.length} server trading logs`,
        details: tradingLogs.slice(0, 5),
        icon: <Database className="h-4 w-4" />,
        category: 'forward_testing'
      };
    } else {
      return {
        name: 'Server Logs',
        status: 'WARNING',
        message: 'Found 0 server trading logs',
        details: [],
        icon: <Database className="h-4 w-4" />,
        category: 'forward_testing'
      };
    }
  } catch (error) {
    return {
      name: 'Server Logs',
      status: 'ERROR',
      message: `Failed to check server logs: ${error.message}`,
      details: { error: error.message },
      icon: <Database className="h-4 w-4" />,
      category: 'forward_testing'
    };
  }
};

export const runDatabaseSessionsCheck = async (user: any): Promise<DiagnosticResult> => {
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
        return {
          name: 'Database Sessions',
          status: 'SUCCESS',
          message: `Found ${dbSessions.length} active database sessions`,
          details: dbSessions,
          icon: <Database className="h-4 w-4" />,
          category: 'forward_testing'
        };
      } else {
        return {
          name: 'Database Sessions',
          status: 'WARNING',
          message: 'No active database sessions found',
          details: [],
          icon: <Database className="h-4 w-4" />,
          category: 'forward_testing'
        };
      }
    } catch (error) {
      return {
        name: 'Database Sessions',
        status: 'ERROR',
        message: `Database query failed: ${error.message}`,
        details: { error: error.message },
        icon: <Database className="h-4 w-4" />,
        category: 'forward_testing'
      };
    }
  } else {
    return {
      name: 'Database Sessions',
      status: 'ERROR',
      message: 'Cannot check database sessions - user not authenticated',
      icon: <Database className="h-4 w-4" />,
      category: 'forward_testing'
    };
  }
};

export const runEdgeFunctionsCheck = async (): Promise<DiagnosticResult> => {
  console.log('🔍 Checking Edge Functions...');
  try {
    const { data, error } = await supabase.functions.invoke('oanda-forward-testing', {
      body: { action: 'ping' }
    });

    if (error) {
      return {
        name: 'Edge Functions',
        status: 'ERROR',
        message: `Edge function error: ${error.message}`,
        details: { error: error.message },
        icon: <Activity className="h-4 w-4" />,
        category: 'forward_testing'
      };
    } else {
      return {
        name: 'Edge Functions',
        status: 'SUCCESS',
        message: 'Edge functions responding correctly',
        details: data,
        icon: <Activity className="h-4 w-4" />,
        category: 'forward_testing'
      };
    }
  } catch (error) {
    return {
      name: 'Edge Functions',
      status: 'ERROR',
      message: `Edge function error: ${error.message}`,
      details: { error: error.message },
      icon: <Activity className="h-4 w-4" />,
      category: 'forward_testing'
    };
  }
};
