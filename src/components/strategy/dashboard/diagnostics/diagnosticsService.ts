
import { supabase } from '@/integrations/supabase/client';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { DiagnosticResults } from './types';

export class DiagnosticsService {
  static async runComprehensiveDiagnostics(): Promise<DiagnosticResults> {
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
    results.rootCause = this.analyzeRootCause(results);
    
    console.log('📊 Comprehensive Diagnosis Complete:', results);
    return results;
  }

  private static analyzeRootCause(results: DiagnosticResults) {
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
  }
}
