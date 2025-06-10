
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOANDAIntegration } from '@/hooks/useOANDAIntegration';
import { testOANDAConnection } from '@/contexts/oanda/connectionUtils';
import { PythonExecutor } from '@/services/pythonExecutor';
import { DiagnosticCheck, OverallStatus } from './types';

export const useDiagnosticChecks = () => {
  const { user } = useAuth();
  const {
    config,
    selectedStrategy,
    connectionStatus,
    isConnected,
    canStartTesting
  } = useOANDAIntegration();

  const [checks, setChecks] = useState<DiagnosticCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<OverallStatus>('not-ready');

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticChecks: DiagnosticCheck[] = [];

    // 1. Authentication Check
    diagnosticChecks.push({
      name: 'User Authentication',
      status: user ? 'pass' : 'fail',
      message: user ? `✅ Authenticated as ${user.email}` : '❌ User not authenticated',
      critical: true
    });

    // 2. OANDA Configuration Check
    const hasOANDAConfig = config.accountId && config.apiKey;
    diagnosticChecks.push({
      name: 'OANDA Configuration',
      status: hasOANDAConfig ? 'pass' : 'fail',
      message: hasOANDAConfig 
        ? `✅ Account: ${config.accountId}, Environment: ${config.environment}`
        : '❌ Missing OANDA credentials',
      critical: true
    });

    // 3. OANDA Connection Test
    if (hasOANDAConfig) {
      try {
        await testOANDAConnection(config);
        diagnosticChecks.push({
          name: 'OANDA API Connection',
          status: 'pass',
          message: '✅ OANDA API connection successful',
          critical: true
        });
      } catch (error) {
        diagnosticChecks.push({
          name: 'OANDA API Connection',
          status: 'fail',
          message: `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          critical: true
        });
      }
    } else {
      diagnosticChecks.push({
        name: 'OANDA API Connection',
        status: 'fail',
        message: '❌ Cannot test - missing credentials',
        critical: true
      });
    }

    // 4. Strategy Selection Check
    diagnosticChecks.push({
      name: 'Strategy Selection',
      status: selectedStrategy ? 'pass' : 'fail',
      message: selectedStrategy 
        ? `✅ Strategy: ${selectedStrategy.strategy_name}`
        : '❌ No strategy selected',
      critical: true
    });

    // 5. Python Strategy Engine Check
    try {
      const isAvailable = await PythonExecutor.isAvailable();
      diagnosticChecks.push({
        name: 'Python Strategy Engine',
        status: isAvailable ? 'pass' : 'fail',
        message: isAvailable 
          ? '✅ Python engine ready for strategy execution'
          : '❌ Python engine not available',
        critical: true
      });
    } catch (error) {
      diagnosticChecks.push({
        name: 'Python Strategy Engine',
        status: 'fail',
        message: `❌ Engine error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      });
    }

    // 6. Strategy Signal Generation Test - FIXED VERSION
    if (selectedStrategy) {
      try {
        console.log('🧪 Testing strategy signal generation...');
        
        // Create realistic test data
        const testData = {
          open: Array(250).fill(0).map((_, i) => 1.1000 + Math.sin(i * 0.1) * 0.01 + Math.random() * 0.002),
          high: Array(250).fill(0).map((_, i) => 1.1020 + Math.sin(i * 0.1) * 0.01 + Math.random() * 0.002),
          low: Array(250).fill(0).map((_, i) => 0.9980 + Math.sin(i * 0.1) * 0.01 + Math.random() * 0.002),
          close: Array(250).fill(0).map((_, i) => 1.1000 + Math.sin(i * 0.1) * 0.01 + Math.random() * 0.002),
          volume: Array(250).fill(1000)
        };

        console.log('🔍 Executing strategy with test data...');
        const result = await PythonExecutor.executeStrategy(selectedStrategy.strategy_code, testData);
        
        console.log('📊 Strategy execution result:', result);
        
        // Enhanced validation with better error handling
        const hasEntry = result.entry && Array.isArray(result.entry);
        const hasExit = result.exit && Array.isArray(result.exit);
        const hasDirection = result.direction && Array.isArray(result.direction);
        const hasTradeDirection = result.trade_direction && Array.isArray(result.trade_direction);
        
        if (result.error) {
          diagnosticChecks.push({
            name: 'Strategy Signal Generation',
            status: 'fail',
            message: `❌ Strategy execution failed: ${result.error}`,
            critical: true
          });
        } else if (!hasEntry) {
          diagnosticChecks.push({
            name: 'Strategy Signal Generation',
            status: 'fail',
            message: '❌ Strategy not generating entry signals array',
            critical: true
          });
        } else if (!hasExit) {
          diagnosticChecks.push({
            name: 'Strategy Signal Generation',
            status: 'fail',
            message: '❌ Strategy not generating exit signals array',
            critical: true
          });
        } else if (!hasDirection && !hasTradeDirection) {
          diagnosticChecks.push({
            name: 'Strategy Signal Generation',
            status: 'fail',
            message: '❌ Strategy not generating directional signals (BUY/SELL)',
            critical: true
          });
        } else {
          // Count actual signals
          const totalEntries = result.entry.filter(Boolean).length;
          const buySignals = (result.direction || result.trade_direction || []).filter((d, i) => 
            result.entry[i] && (d === 'BUY' || d === 'buy')).length;
          const sellSignals = (result.direction || result.trade_direction || []).filter((d, i) => 
            result.entry[i] && (d === 'SELL' || d === 'sell')).length;
          
          console.log(`📈 Signal counts: Entry=${totalEntries}, BUY=${buySignals}, SELL=${sellSignals}`);
          
          if (totalEntries === 0) {
            diagnosticChecks.push({
              name: 'Strategy Signal Generation',
              status: 'warning',
              message: '⚠️ Strategy generates no entry signals with current test data',
              critical: false
            });
          } else if (buySignals === 0 && sellSignals === 0) {
            diagnosticChecks.push({
              name: 'Strategy Signal Generation',
              status: 'warning',
              message: `⚠️ Strategy generates ${totalEntries} entry signals but no BUY/SELL directions`,
              critical: false
            });
          } else {
            diagnosticChecks.push({
              name: 'Strategy Signal Generation',
              status: 'pass',
              message: `✅ Strategy generates ${buySignals} BUY and ${sellSignals} SELL signals (${totalEntries} total entries)`,
              critical: false
            });
          }
        }

      } catch (error) {
        console.error('❌ Strategy execution error:', error);
        diagnosticChecks.push({
          name: 'Strategy Signal Generation',
          status: 'fail',
          message: `❌ Strategy test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          critical: true
        });
      }
    }

    // 7. Trading Permissions Check
    diagnosticChecks.push({
      name: 'Trading Permissions',
      status: config.environment === 'practice' ? 'pass' : 'warning',
      message: config.environment === 'practice' 
        ? '✅ Using practice environment (safe for testing)'
        : '⚠️ LIVE environment - real money at risk!',
      critical: false
    });

    // 8. Risk Management Settings
    const hasRiskSettings = selectedStrategy?.risk_per_trade && selectedStrategy?.stop_loss;
    diagnosticChecks.push({
      name: 'Risk Management',
      status: hasRiskSettings ? 'pass' : 'warning',
      message: hasRiskSettings
        ? `✅ Risk: ${selectedStrategy.risk_per_trade}%, Stop Loss: ${selectedStrategy.stop_loss}%`
        : '⚠️ Risk management settings not configured',
      critical: false
    });

    // 9. Server Session Check
    try {
      const activeSessions = await fetch('/api/check-sessions').then(r => r.json()).catch(() => []);
      const sessionCount = Array.isArray(activeSessions) ? activeSessions.length : 0;
      
      diagnosticChecks.push({
        name: 'Server Trading Sessions',
        status: sessionCount > 0 ? 'pass' : 'warning',
        message: sessionCount > 0 
          ? `✅ ${sessionCount} active server-side trading sessions`
          : '⚠️ No active server-side trading sessions',
        critical: false
      });
    } catch (error) {
      diagnosticChecks.push({
        name: 'Server Trading Sessions',
        status: 'warning',
        message: '⚠️ Could not check server session status',
        critical: false
      });
    }

    setChecks(diagnosticChecks);

    // Determine overall status
    const criticalFailures = diagnosticChecks.filter(c => c.critical && c.status === 'fail');
    const warnings = diagnosticChecks.filter(c => c.status === 'warning');

    if (criticalFailures.length > 0) {
      setOverallStatus('not-ready');
    } else if (warnings.length > 0) {
      setOverallStatus('warning');
    } else {
      setOverallStatus('ready');
    }

    setIsRunning(false);
  };

  return {
    checks,
    isRunning,
    overallStatus,
    runDiagnostics
  };
};
