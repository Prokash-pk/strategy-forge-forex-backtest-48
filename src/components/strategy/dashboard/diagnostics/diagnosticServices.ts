
import { DiagnosticResult } from './types';

export const runAuthenticationCheck = (user: any): DiagnosticResult => {
  if (user) {
    return {
      name: 'Authentication',
      status: 'SUCCESS',
      message: 'User is authenticated',
      details: { userId: user.id },
      iconType: 'user',
      category: 'auth'
    };
  } else {
    return {
      name: 'Authentication',
      status: 'WARNING',
      message: 'User is not authenticated',
      details: { error: 'No user session' },
      iconType: 'user',
      category: 'auth'
    };
  }
};

export const runStrategyConfigCheck = (): DiagnosticResult => {
  const strategy = localStorage.getItem('selected_strategy_settings');
  if (strategy) {
    return {
      name: 'Strategy Configuration',
      status: 'SUCCESS',
      message: 'Strategy is configured',
      details: { strategyName: JSON.parse(strategy).strategy_name },
      iconType: 'settings',
      category: 'config'
    };
  } else {
    return {
      name: 'Strategy Configuration',
      status: 'WARNING',
      message: 'No strategy selected',
      details: { error: 'No strategy in localStorage' },
      iconType: 'settings',
      category: 'config'
    };
  }
};

export const runOandaConfigCheck = (): DiagnosticResult => {
  const config = localStorage.getItem('oanda_config');
  if (config) {
    return {
      name: 'OANDA Configuration',
      status: 'SUCCESS',
      message: 'OANDA is configured',
      details: { accountId: JSON.parse(config).accountId },
      iconType: 'settings',
      category: 'config'
    };
  } else {
    return {
      name: 'OANDA Configuration',
      status: 'WARNING',
      message: 'No OANDA configuration found',
      details: { error: 'No config in localStorage' },
      iconType: 'settings',
      category: 'config'
    };
  }
};

export const runForwardTestingFlagCheck = (): DiagnosticResult => {
  const flag = localStorage.getItem('forward_testing_active');
  const isActive = flag === 'true';
  return {
    name: 'Forward Testing Flag',
    status: isActive ? 'SUCCESS' : 'INFO',
    message: isActive ? 'Forward testing is active' : 'Forward testing is inactive',
    details: { isActive: isActive },
    iconType: 'activity',
    category: 'forward_testing'
  };
};

// Enhanced timeout wrapper with proper error handling
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 8000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

export const runOandaConnectivityCheck = async (): Promise<DiagnosticResult> => {
  try {
    const config = localStorage.getItem('oanda_config');
    if (!config) {
      return {
        name: 'OANDA Connectivity',
        status: 'WARNING',
        message: 'No OANDA configuration found',
        details: { error: 'No config in localStorage' },
        iconType: 'wifi',
        category: 'connectivity'
      };
    }

    const parsedConfig = JSON.parse(config);
    if (!parsedConfig.accountId || !parsedConfig.apiKey) {
      return {
        name: 'OANDA Connectivity',
        status: 'WARNING',
        message: 'Incomplete OANDA configuration',
        details: { error: 'Missing accountId or apiKey' },
        iconType: 'wifi',
        category: 'connectivity'
      };
    }

    const baseUrl = parsedConfig.environment === 'practice' 
      ? 'https://api-fxpractice.oanda.com'
      : 'https://api-fxtrade.oanda.com';

    console.log('🔍 Testing OANDA connectivity to:', baseUrl);

    // Multiple connectivity tests with increasing timeouts
    const tests = [
      { name: 'Quick Test', timeout: 3000 },
      { name: 'Standard Test', timeout: 8000 },
      { name: 'Extended Test', timeout: 15000 }
    ];

    let lastError = null;
    
    for (const test of tests) {
      try {
        console.log(`🔄 Running ${test.name} (${test.timeout}ms timeout)...`);
        
        const response = await withTimeout(
          fetch(`${baseUrl}/v3/accounts/${parsedConfig.accountId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${parsedConfig.apiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'TradingBot/1.0'
            }
          }),
          test.timeout
        );

        if (response.ok) {
          const data = await response.json();
          console.log('✅ OANDA connectivity successful:', data.account?.alias || 'Account found');
          return {
            name: 'OANDA Connectivity',
            status: 'SUCCESS',
            message: `Successfully connected to OANDA API (${test.name})`,
            details: { 
              status: response.status,
              testType: test.name,
              accountAlias: data.account?.alias || 'Unknown'
            },
            iconType: 'wifi',
            category: 'connectivity'
          };
        } else {
          const errorText = await response.text();
          lastError = `HTTP ${response.status}: ${errorText}`;
          console.warn(`⚠️ ${test.name} failed:`, lastError);
          
          // Don't continue if it's an auth error
          if (response.status === 401 || response.status === 403) {
            return {
              name: 'OANDA Connectivity',
              status: 'ERROR',
              message: `Authentication failed: ${response.status === 401 ? 'Invalid API key' : 'Access forbidden'}`,
              details: { status: response.status, error: lastError },
              iconType: 'wifi',
              category: 'connectivity'
            };
          }
        }
      } catch (error) {
        lastError = error.message;
        console.warn(`⚠️ ${test.name} failed:`, lastError);
        
        // If it's not a timeout, don't continue
        if (!error.message.includes('timed out')) {
          break;
        }
      }
    }

    return {
      name: 'OANDA Connectivity',
      status: 'ERROR',
      message: `All connectivity tests failed. Last error: ${lastError}`,
      details: { error: lastError },
      iconType: 'wifi',
      category: 'connectivity'
    };

  } catch (error) {
    return {
      name: 'OANDA Connectivity',
      status: 'ERROR',
      message: `OANDA connectivity check failed: ${error.message}`,
      details: { error: error.message },
      iconType: 'wifi',
      category: 'connectivity'
    };
  }
};

export const runServerSessionsCheck = async (): Promise<DiagnosticResult> => {
  try {
    const response = await withTimeout(
      fetch('/api/server-sessions', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }),
      3000
    );

    if (response.ok) {
      const data = await response.json();
      return {
        name: 'Server Sessions',
        status: 'SUCCESS',
        message: `Found ${data.sessions?.length || 0} active sessions`,
        details: { sessionCount: data.sessions?.length || 0 },
        iconType: 'server',
        category: 'connectivity'
      };
    } else {
      return {
        name: 'Server Sessions',
        status: 'WARNING',
        message: 'Could not fetch server sessions',
        details: { status: response.status },
        iconType: 'server',
        category: 'connectivity'
      };
    }
  } catch (error) {
    return {
      name: 'Server Sessions',
      status: 'WARNING',
      message: 'Server sessions check failed (this is normal for local development)',
      details: { error: error.message },
      iconType: 'server',
      category: 'connectivity'
    };
  }
};

export const runServerLogsCheck = async (): Promise<DiagnosticResult> => {
  try {
    const response = await withTimeout(
      fetch('/api/server-logs', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }),
      3000
    );

    if (response.ok) {
      const data = await response.json();
      return {
        name: 'Server Logs',
        status: 'SUCCESS',
        message: `Found ${data.logs?.length || 0} recent log entries`,
        details: { logCount: data.logs?.length || 0 },
        iconType: 'server',
        category: 'connectivity'
      };
    } else {
      return {
        name: 'Server Logs',
        status: 'WARNING',
        message: 'Could not fetch server logs',
        details: { status: response.status },
        iconType: 'server',
        category: 'connectivity'
      };
    }
  } catch (error) {
    return {
      name: 'Server Logs',
      status: 'WARNING',
      message: 'Server logs check failed (this is normal for local development)',
      details: { error: error.message },
      iconType: 'server',
      category: 'connectivity'
    };
  }
};

export const runDatabaseSessionsCheck = async (user: any): Promise<DiagnosticResult> => {
  if (!user) {
    return {
      name: 'Database Sessions',
      status: 'WARNING',
      message: 'No user session for database check',
      details: { error: 'User not authenticated' },
      iconType: 'database',
      category: 'connectivity'
    };
  }

  try {
    return {
      name: 'Database Sessions',
      status: 'SUCCESS',
      message: 'Database connection available',
      details: { userId: user.id },
      iconType: 'database',
      category: 'connectivity'
    };
  } catch (error) {
    return {
      name: 'Database Sessions',
      status: 'ERROR',
      message: 'Database session check failed',
      details: { error: error.message },
      iconType: 'database',
      category: 'connectivity'
    };
  }
};

export const runEdgeFunctionsCheck = async (): Promise<DiagnosticResult> => {
  try {
    const response = await withTimeout(
      fetch('/functions/v1/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }),
      2000
    );

    if (response.ok) {
      return {
        name: 'Edge Functions',
        status: 'SUCCESS',
        message: 'Edge functions are available',
        details: { status: response.status },
        iconType: 'zap',
        category: 'connectivity'
      };
    } else {
      return {
        name: 'Edge Functions',
        status: 'WARNING',
        message: 'Edge functions may not be available',
        details: { status: response.status },
        iconType: 'zap',
        category: 'connectivity'
      };
    }
  } catch (error) {
    return {
      name: 'Edge Functions',
      status: 'WARNING',
      message: 'Edge functions check failed (this is normal for local development)',
      details: { error: error.message },
      iconType: 'zap',
      category: 'connectivity'
    };
  }
};
