
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
          message: `❌ Connection failed: ${error.message}`,
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
        message: `❌ Engine error: ${error.message}`,
        critical: true
      });
    }

    // 6. Enhanced Strategy Signal Validation
    if (selectedStrategy) {
      try {
        console.log('🧪 Testing strategy signal generation with enhanced detection...');
        
        // Create more realistic mock market data for testing with correct property names
        const mockData = {
          open: Array(250).fill(0).map((_, i) => 1.1000 + Math.sin(i * 0.1) * 0.01 + Math.random() * 0.005),
          high: Array(250).fill(0).map((_, i) => 1.1050 + Math.sin(i * 0.1) * 0.01 + Math.random() * 0.005),
          low: Array(250).fill(0).map((_, i) => 1.0950 + Math.sin(i * 0.1) * 0.01 + Math.random() * 0.005),
          close: Array(250).fill(0).map((_, i) => 1.1000 + Math.sin(i * 0.1) * 0.01 + Math.random() * 0.005),
          volume: Array(250).fill(1000)
        };

        console.log('🔍 Executing strategy with mock data...');
        const result = await PythonExecutor.executeStrategy(selectedStrategy.strategy_code, mockData);
        
        console.log('📊 Strategy execution result:', result);
        
        // Check for various signal formats
        const hasEntry = result.entry && Array.isArray(result.entry) && result.entry.some(Boolean);
        const hasExit = result.exit && Array.isArray(result.exit);
        
        // Check for direction array (primary method)
        const hasDirection = result.direction && Array.isArray(result.direction);
        
        // Check for alternative naming conventions
        const hasEntryType = result.entry_type && Array.isArray(result.entry_type);
        const hasTradeDirection = result.trade_direction && Array.isArray(result.trade_direction);
        
        // Count actual signals
        let buySignals = 0;
        let sellSignals = 0;
        
        if (hasDirection) {
          buySignals = result.direction.filter((d, i) => result.entry[i] && d === 'BUY').length;
          sellSignals = result.direction.filter((d, i) => result.entry[i] && d === 'SELL').length;
        } else if (hasEntryType) {
          buySignals = result.entry_type.filter((d, i) => result.entry[i] && d === 'BUY').length;
          sellSignals = result.entry_type.filter((d, i) => result.entry[i] && d === 'SELL').length;
        } else if (hasTradeDirection) {
          buySignals = result.trade_direction.filter((d, i) => result.entry[i] && d === 'BUY').length;
          sellSignals = result.trade_direction.filter((d, i) => result.entry[i] && d === 'SELL').length;
        }

        console.log(`📈 Signal counts: BUY=${buySignals}, SELL=${sellSignals}`);

        // Auto-detection logic for strategies without explicit direction
        if (!hasDirection && !hasEntryType && !hasTradeDirection && hasEntry) {
          console.log('🔧 No explicit direction found, checking for auto-detection capability...');
          
          // Check if strategy has indicators that can be used for direction detection
          const hasIndicators = result.short_ema || result.long_ema || result.rsi || result.ema_fast || result.ema_slow;
          
          if (hasIndicators) {
            console.log('✅ Strategy has indicators for auto-direction detection');
            diagnosticChecks.push({
              name: 'Strategy Signal Generation',
              status: 'warning',
              message: `⚠️ Strategy generates entry signals but no explicit BUY/SELL directions. System will auto-detect from indicators (${result.entry.filter(Boolean).length} entry signals found)`,
              critical: false
            });
          } else {
            diagnosticChecks.push({
              name: 'Strategy Signal Generation',
              status: 'fail',
              message: '❌ Strategy missing both BUY/SELL directions and indicators for auto-detection',
              critical: true
            });
          }
        } else if (buySignals > 0 || sellSignals > 0) {
          diagnosticChecks.push({
            name: 'Strategy Signal Generation',
            status: 'pass',
            message: `✅ Strategy generates BUY/SELL signals: ${buySignals} BUY, ${sellSignals} SELL`,
            critical: false
          });
        } else if (hasEntry) {
          diagnosticChecks.push({
            name: 'Strategy Signal Generation',
            status: 'warning',
            message: `⚠️ Strategy has entry signals (${result.entry.filter(Boolean).length}) but no BUY/SELL directions detected`,
            critical: false
          });
        } else {
          diagnosticChecks.push({
            name: 'Strategy Signal Generation',
            status: 'fail',
            message: '❌ Strategy not generating any trading signals',
            critical: true
          });
        }

      } catch (error) {
        console.error('❌ Strategy execution error:', error);
        diagnosticChecks.push({
          name: 'Strategy Signal Generation',
          status: 'fail',
          message: `❌ Strategy execution failed: ${error.message}`,
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
