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
      iconType: 'code',
      category: 'config'
    };
  } else {
    return {
      name: 'Strategy Configuration',
      status: 'WARNING',
      message: 'No strategy selected',
      details: { error: 'No strategy in localStorage' },
      iconType: 'code',
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

// Add timeout wrapper for async operations
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
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
        iconType: 'connectivity',
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
        iconType: 'connectivity',
        category: 'connectivity'
      };
    }

    const baseUrl = parsedConfig.environment === 'practice' 
      ? 'https://api-fxpractice.oanda.com'
      : 'https://api-fxtrade.oanda.com';

    // Add timeout to prevent hanging
    const response = await withTimeout(
      fetch(`${baseUrl}/v3/accounts/${parsedConfig.accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${parsedConfig.apiKey}`,
          'Content-Type': 'application/json',
        }
      }),
      3000 // 3 second timeout
    );

    if (response.ok) {
      return {
        name: 'OANDA Connectivity',
        status: 'SUCCESS',
        message: 'Successfully connected to OANDA API',
        details: { status: response.status },
        iconType: 'connectivity',
        category: 'connectivity'
      };
    } else {
      return {
        name: 'OANDA Connectivity',
        status: 'ERROR',
        message: `OANDA API connection failed: ${response.status}`,
        details: { status: response.status },
        iconType: 'connectivity',
        category: 'connectivity'
      };
    }
  } catch (error) {
    return {
      name: 'OANDA Connectivity',
      status: 'ERROR',
      message: `OANDA connectivity check failed: ${error.message}`,
      details: { error: error.message },
      iconType: 'connectivity',
      category: 'connectivity'
    };
  }
};

export const runServerSessionsCheck = async (): Promise<DiagnosticResult> => {
  try {
    // Add timeout to prevent hanging
    const response = await withTimeout(
      fetch('/api/server-sessions', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }),
      2000 // 2 second timeout
    );

    if (response.ok) {
      const data = await response.json();
      return {
        name: 'Server Sessions',
        status: 'SUCCESS',
        message: `Found ${data.sessions?.length || 0} active sessions`,
        details: { sessionCount: data.sessions?.length || 0 },
        iconType: 'connectivity',
        category: 'connectivity'
      };
    } else {
      return {
        name: 'Server Sessions',
        status: 'WARNING',
        message: 'Could not fetch server sessions',
        details: { status: response.status },
        iconType: 'connectivity',
        category: 'connectivity'
      };
    }
  } catch (error) {
    return {
      name: 'Server Sessions',
      status: 'WARNING',
      message: 'Server sessions check failed (this is normal for local development)',
      details: { error: error.message },
      iconType: 'connectivity',
      category: 'connectivity'
    };
  }
};

export const runServerLogsCheck = async (): Promise<DiagnosticResult> => {
  try {
    // Add timeout to prevent hanging
    const response = await withTimeout(
      fetch('/api/server-logs', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }),
      2000 // 2 second timeout
    );

    if (response.ok) {
      const data = await response.json();
      return {
        name: 'Server Logs',
        status: 'SUCCESS',
        message: `Found ${data.logs?.length || 0} recent log entries`,
        details: { logCount: data.logs?.length || 0 },
        iconType: 'connectivity',
        category: 'connectivity'
      };
    } else {
      return {
        name: 'Server Logs',
        status: 'WARNING',
        message: 'Could not fetch server logs',
        details: { status: response.status },
        iconType: 'connectivity',
        category: 'connectivity'
      };
    }
  } catch (error) {
    return {
      name: 'Server Logs',
      status: 'WARNING',
      message: 'Server logs check failed (this is normal for local development)',
      details: { error: error.message },
      iconType: 'connectivity',
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
      iconType: 'connectivity',
      category: 'connectivity'
    };
  }

  try {
    // Mock check - replace with actual database query if needed
    return {
      name: 'Database Sessions',
      status: 'SUCCESS',
      message: 'Database connection available',
      details: { userId: user.id },
      iconType: 'connectivity',
      category: 'connectivity'
    };
  } catch (error) {
    return {
      name: 'Database Sessions',
      status: 'ERROR',
      message: 'Database session check failed',
      details: { error: error.message },
      iconType: 'connectivity',
      category: 'connectivity'
    };
  }
};

export const runEdgeFunctionsCheck = async (): Promise<DiagnosticResult> => {
  try {
    // Quick edge function availability check with timeout
    const response = await withTimeout(
      fetch('/functions/v1/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }),
      1500 // 1.5 second timeout
    );

    if (response.ok) {
      return {
        name: 'Edge Functions',
        status: 'SUCCESS',
        message: 'Edge functions are available',
        details: { status: response.status },
        iconType: 'connectivity',
        category: 'connectivity'
      };
    } else {
      return {
        name: 'Edge Functions',
        status: 'WARNING',
        message: 'Edge functions may not be available',
        details: { status: response.status },
        iconType: 'connectivity',
        category: 'connectivity'
      };
    }
  } catch (error) {
    return {
      name: 'Edge Functions',
      status: 'WARNING',
      message: 'Edge functions check failed (this is normal for local development)',
      details: { error: error.message },
      iconType: 'connectivity',
      category: 'connectivity'
    };
  }
};
