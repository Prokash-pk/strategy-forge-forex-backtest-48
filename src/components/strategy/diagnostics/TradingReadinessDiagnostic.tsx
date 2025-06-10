
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useOANDAIntegration } from '@/hooks/useOANDAIntegration';
import { testOANDAConnection } from '@/contexts/oanda/connectionUtils';
import { PythonExecutor } from '@/services/pythonExecutor';
import { CheckCircle, AlertTriangle, XCircle, Activity, Zap, Settings } from 'lucide-react';

interface DiagnosticCheck {
  name: string;
  status: 'checking' | 'pass' | 'fail' | 'warning';
  message: string;
  critical: boolean;
}

const TradingReadinessDiagnostic: React.FC = () => {
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
  const [overallStatus, setOverallStatus] = useState<'ready' | 'warning' | 'not-ready'>('not-ready');

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

    // 6. Strategy Signal Validation
    if (selectedStrategy) {
      try {
        console.log('🧪 Testing strategy signal generation...');
        
        // Create mock market data for testing
        const mockData = {
          open: Array(100).fill(0).map((_, i) => 1.1000 + Math.random() * 0.01),
          high: Array(100).fill(0).map((_, i) => 1.1050 + Math.random() * 0.01),
          low: Array(100).fill(0).map((_, i) => 1.0950 + Math.random() * 0.01),
          close: Array(100).fill(0).map((_, i) => 1.1000 + Math.random() * 0.01),
          volume: Array(100).fill(1000)
        };

        const result = await PythonExecutor.executeStrategy(selectedStrategy.strategy_code, mockData);
        
        const hasValidSignals = result.entry && result.direction && 
          result.entry.some(Boolean) && 
          result.direction.some(d => d === 'BUY' || d === 'SELL');

        diagnosticChecks.push({
          name: 'Strategy Signal Generation',
          status: hasValidSignals ? 'pass' : 'warning',
          message: hasValidSignals
            ? `✅ Strategy generates valid BUY/SELL signals`
            : '⚠️ Strategy not generating clear directional signals',
          critical: false
        });

      } catch (error) {
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

  useEffect(() => {
    runDiagnostics();
  }, [config, selectedStrategy, user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const getOverallStatusBadge = () => {
    switch (overallStatus) {
      case 'ready':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Ready for Auto Trading</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-600"><AlertTriangle className="h-3 w-3 mr-1" />Ready with Warnings</Badge>;
      default:
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Not Ready</Badge>;
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Auto Trading Readiness Check
          </div>
          {getOverallStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-slate-300">
            Comprehensive check to verify all systems are ready for automated trading
          </p>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? <Activity className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
            {isRunning ? 'Checking...' : 'Run Diagnostics'}
          </Button>
        </div>

        <div className="space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-slate-700 rounded-lg">
              {getStatusIcon(check.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{check.name}</span>
                  {check.critical && <Badge variant="outline" className="text-xs">Critical</Badge>}
                </div>
                <p className="text-sm text-slate-300 mt-1">{check.message}</p>
              </div>
            </div>
          ))}
        </div>

        {overallStatus === 'ready' && (
          <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
            <h4 className="text-green-400 font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              🚀 System Ready for Auto Trading!
            </h4>
            <p className="text-green-300 text-sm mt-2">
              All critical systems are operational. You can now start forward testing and the system will execute real trades based on your Python strategy signals.
            </p>
          </div>
        )}

        {overallStatus === 'warning' && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
            <h4 className="text-yellow-400 font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              ⚠️ Ready with Warnings
            </h4>
            <p className="text-yellow-300 text-sm mt-2">
              Core systems are ready but some non-critical issues were found. Auto trading will work but consider addressing the warnings above.
            </p>
          </div>
        )}

        {overallStatus === 'not-ready' && (
          <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
            <h4 className="text-red-400 font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              ❌ System Not Ready
            </h4>
            <p className="text-red-300 text-sm mt-2">
              Critical issues prevent auto trading. Please resolve the failed checks above before starting forward testing.
            </p>
          </div>
        )}

        <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-600">
          Last check: {new Date().toLocaleString()} • {checks.length} checks completed
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingReadinessDiagnostic;
