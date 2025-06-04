import { DiagnosticResult } from './types';
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
      iconType: 'user',
      category: 'auth'
    };
  } else {
    return {
      name: 'Authentication',
      status: 'ERROR',
      message: 'User not authenticated',
      iconType: 'user',
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
      iconType: 'settings',
      category: 'config'
    };
  } else {
    return {
      name: 'Strategy Config',
      status: 'ERROR',
      message: 'No strategy selected',
      iconType: 'settings',
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
        iconType: 'settings',
        category: 'config'
      };
    } else {
      return {
        name: 'Oanda Config',
        status: 'ERROR',
        message: 'OANDA config incomplete (missing credentials)',
        details: parsedConfig,
        iconType: 'settings',
        category: 'config'
      };
    }
  } else {
    return {
      name: 'Oanda Config',
      status: 'ERROR',
      message: 'No OANDA config found',
      iconType: 'settings',
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

        console.log('Testing OANDA connection:', {
          baseUrl,
          accountId: parsedConfig.accountId,
          environment: parsedConfig.environment,
          apiKeyLength: parsedConfig.apiKey.length
        });

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
            iconType: 'wifi',
            category: 'connectivity'
          };
        } else {
          const errorData = await response.json();
          console.error('OANDA API Error:', errorData);
          
          // Provide specific guidance based on error type
          let userMessage = `OANDA connection failed: ${response.status} - ${errorData.errorMessage || response.statusText}`;
          if (response.status === 401) {
            userMessage += '. This usually means your API token is invalid, expired, or doesn\'t have access to this account. Please check your OANDA credentials in the Configuration tab.';
          }
          
          return {
            name: 'Oanda Connectivity',
            status: 'ERROR',
            message: userMessage,
            details: { status: response.status, error: errorData },
            iconType: 'wifi',
            category: 'connectivity'
          };
        }
      } catch (error) {
        console.error('OANDA connectivity error:', error);
        return {
          name: 'Oanda Connectivity',
          status: 'ERROR',
          message: `OANDA connectivity test failed: ${error.message}. Please check your internet connection and OANDA credentials.`,
          details: { error: error.message },
          iconType: 'wifi',
          category: 'connectivity'
        };
      }
    } else {
      return {
        name: 'Oanda Connectivity',
        status: 'ERROR',
        message: 'No OANDA credentials to test - Please configure your Account ID and API Token in the Configuration tab',
        iconType: 'wifi',
        category: 'connectivity'
      };
    }
  } else {
    return {
      name: 'Oanda Connectivity',
      status: 'ERROR',
      message: 'No OANDA config found for connectivity test - Please set up OANDA configuration first',
      iconType: 'wifi',
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
      iconType: 'zap',
      category: 'forward_testing'
    };
  } else if (forwardTestingFlag === 'false') {
    return {
      name: 'Forward Testing Flag',
      status: 'WARNING',
      message: 'Local flag: inactive',
      details: { flag: forwardTestingFlag },
      iconType: 'zap',
      category: 'forward_testing'
    };
  } else {
    return {
      name: 'Forward Testing Flag',
      status: 'WARNING',
      message: 'Local flag: null',
      details: { flag: forwardTestingFlag },
      iconType: 'zap',
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
        iconType: 'server',
        category: 'forward_testing'
      };
    } else {
      return {
        name: 'Server Sessions',
        status: 'WARNING',
        message: 'No active server sessions found',
        details: activeSessions,
        iconType: 'server',
        category: 'forward_testing'
      };
    }
  } catch (error) {
    return {
      name: 'Server Sessions',
      status: 'ERROR',
      message: `Failed to check server sessions: ${error.message}`,
      details: { error: error.message },
      iconType: 'server',
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
        iconType: 'database',
        category: 'forward_testing'
      };
    } else {
      return {
        name: 'Server Logs',
        status: 'WARNING',
        message: 'Found 0 server trading logs',
        details: [],
        iconType: 'database',
        category: 'forward_testing'
      };
    }
  } catch (error) {
    return {
      name: 'Server Logs',
      status: 'ERROR',
      message: `Failed to check server logs: ${error.message}`,
      details: { error: error.message },
      iconType: 'database',
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
          iconType: 'database',
          category: 'forward_testing'
        };
      } else {
        return {
          name: 'Database Sessions',
          status: 'WARNING',
          message: 'No active database sessions found',
          details: [],
          iconType: 'database',
          category: 'forward_testing'
        };
      }
    } catch (error) {
      return {
        name: 'Database Sessions',
        status: 'ERROR',
        message: `Database query failed: ${error.message}`,
        details: { error: error.message },
        iconType: 'database',
        category: 'forward_testing'
      };
    }
  } else {
    return {
      name: 'Database Sessions',
      status: 'ERROR',
      message: 'Cannot check database sessions - user not authenticated',
      iconType: 'database',
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
      console.error('Edge function error:', error);
      return {
        name: 'Edge Functions',
        status: 'ERROR',
        message: `Edge function error: ${error.message}. The server-side trading system may not be available.`,
        details: { error: error.message },
        iconType: 'activity',
        category: 'forward_testing'
      };
    } else {
      console.log('Edge function response:', data);
      return {
        name: 'Edge Functions',
        status: 'SUCCESS',
        message: 'Edge functions responding correctly - Server-side trading system is operational',
        details: data,
        iconType: 'activity',
        category: 'forward_testing'
      };
    }
  } catch (error) {
    console.error('Edge function test error:', error);
    return {
      name: 'Edge Functions',
      status: 'ERROR',
      message: `Edge function test failed: ${error.message}. Server-side autonomous trading may not be available.`,
      details: { error: error.message },
      iconType: 'activity',
      category: 'forward_testing'
    };
  }
};
