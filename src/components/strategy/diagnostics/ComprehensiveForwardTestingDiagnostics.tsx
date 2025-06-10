
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Settings, 
  Code, 
  Database,
  Wifi,
  Play,
  Shield,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOANDAIntegration } from '@/hooks/useOANDAIntegration';
import { PythonExecutor } from '@/services/pythonExecutor';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { testOANDAConnection } from '@/contexts/oanda/connectionUtils';

interface DiagnosticItem {
  id: string;
  category: 'python' | 'strategy' | 'oanda' | 'server' | 'trading' | 'system';
  name: string;
  status: 'checking' | 'pass' | 'warning' | 'fail';
  message: string;
  critical: boolean;
  solution?: string;
  icon: React.ReactNode;
}

const ComprehensiveForwardTestingDiagnostics: React.FC = () => {
  const { user } = useAuth();
  const { config, selectedStrategy, isConnected, connectionStatus } = useOANDAIntegration();
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'checking' | 'ready' | 'warning' | 'critical'>('checking');

  const runComprehensiveDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticItem[] = [];

    // PYTHON ENGINE DIAGNOSTICS
    try {
      console.log('🔍 Testing Python Engine...');
      const pythonAvailable = await PythonExecutor.isAvailable();
      
      if (pythonAvailable) {
        results.push({
          id: 'python-engine',
          category: 'python',
          name: 'Python Engine Availability',
          status: 'pass',
          message: '✅ Python/Pyodide engine is loaded and ready',
          critical: true,
          icon: <Code className="h-4 w-4" />
        });

        // Test Python imports specifically
        try {
          const testResult = await PythonExecutor.executeStrategy(
            'print("Python engine test")\nresult = {"test": True}',
            { open: [1.0], high: [1.1], low: [0.9], close: [1.0], volume: [1000] }
          );
          
          results.push({
            id: 'python-execution',
            category: 'python',
            name: 'Python Code Execution',
            status: 'pass',
            message: '✅ Python code can execute successfully',
            critical: true,
            icon: <Play className="h-4 w-4" />
          });
        } catch (error: any) {
          results.push({
            id: 'python-execution',
            category: 'python',
            name: 'Python Code Execution',
            status: 'fail',
            message: `❌ Python execution failed: ${error.message}`,
            critical: true,
            solution: 'The Python environment has import errors. This needs to be fixed in the Python setup.',
            icon: <XCircle className="h-4 w-4" />
          });
        }
      } else {
        results.push({
          id: 'python-engine',
          category: 'python',
          name: 'Python Engine Availability',
          status: 'fail',
          message: '❌ Python/Pyodide engine failed to load',
          critical: true,
          solution: 'Refresh the page or check your internet connection. Pyodide needs to download from CDN.',
          icon: <XCircle className="h-4 w-4" />
        });
      }
    } catch (error: any) {
      results.push({
        id: 'python-engine',
        category: 'python',
        name: 'Python Engine Availability',
        status: 'fail',
        message: `❌ Python engine error: ${error.message}`,
        critical: true,
        solution: 'Critical Python engine failure. Try refreshing the page.',
        icon: <XCircle className="h-4 w-4" />
      });
    }

    // USER AUTHENTICATION
    results.push({
      id: 'user-auth',
      category: 'system',
      name: 'User Authentication',
      status: user ? 'pass' : 'fail',
      message: user ? `✅ Authenticated as ${user.email}` : '❌ User not authenticated',
      critical: true,
      solution: user ? undefined : 'Please log in to your account to enable trading features.',
      icon: <Shield className="h-4 w-4" />
    });

    // STRATEGY CONFIGURATION
    if (selectedStrategy) {
      results.push({
        id: 'strategy-selected',
        category: 'strategy',
        name: 'Strategy Selection',
        status: 'pass',
        message: `✅ Strategy selected: ${selectedStrategy.strategy_name}`,
        critical: true,
        icon: <Settings className="h-4 w-4" />
      });

      // Check strategy code quality
      const hasStrategyCode = selectedStrategy.strategy_code && selectedStrategy.strategy_code.trim().length > 0;
      const hasStrategyLogic = selectedStrategy.strategy_code?.includes('strategy_logic') || 
                               selectedStrategy.strategy_code?.includes('def ');
      
      if (hasStrategyCode && hasStrategyLogic) {
        results.push({
          id: 'strategy-code',
          category: 'strategy',
          name: 'Strategy Code Quality',
          status: 'pass',
          message: '✅ Strategy has valid Python code with logic functions',
          critical: true,
          icon: <Code className="h-4 w-4" />
        });
      } else {
        results.push({
          id: 'strategy-code',
          category: 'strategy',
          name: 'Strategy Code Quality',
          status: 'fail',
          message: '❌ Strategy code is missing or incomplete',
          critical: true,
          solution: 'Add valid Python strategy code with strategy_logic function that returns entry/exit signals.',
          icon: <XCircle className="h-4 w-4" />
        });
      }

      // Test strategy signal generation
      if (hasStrategyCode && hasStrategyLogic) {
        try {
          const testData = {
            open: Array(100).fill(0).map((_, i) => 1.1000 + Math.sin(i * 0.1) * 0.01),
            high: Array(100).fill(0).map((_, i) => 1.1020 + Math.sin(i * 0.1) * 0.01),
            low: Array(100).fill(0).map((_, i) => 0.9980 + Math.sin(i * 0.1) * 0.01),
            close: Array(100).fill(0).map((_, i) => 1.1000 + Math.sin(i * 0.1) * 0.01),
            volume: Array(100).fill(1000)
          };

          const signals = await PythonExecutor.executeStrategy(selectedStrategy.strategy_code, testData);
          
          if (signals.error) {
            results.push({
              id: 'strategy-signals',
              category: 'strategy',
              name: 'Strategy Signal Generation',
              status: 'fail',
              message: `❌ Strategy execution error: ${signals.error}`,
              critical: true,
              solution: 'Fix the Python syntax or logic errors in your strategy code.',
              icon: <XCircle className="h-4 w-4" />
            });
          } else {
            const hasValidSignals = signals.entry && Array.isArray(signals.entry) && 
                                  signals.direction && Array.isArray(signals.direction);
            
            if (hasValidSignals) {
              const signalCount = signals.entry.filter(Boolean).length;
              results.push({
                id: 'strategy-signals',
                category: 'strategy',
                name: 'Strategy Signal Generation',
                status: signalCount > 0 ? 'pass' : 'warning',
                message: signalCount > 0 
                  ? `✅ Strategy generates ${signalCount} trading signals`
                  : '⚠️ Strategy runs but generates no signals with test data',
                critical: false,
                solution: signalCount === 0 ? 'Adjust strategy parameters to be more sensitive to generate signals.' : undefined,
                icon: signalCount > 0 ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />
              });
            } else {
              results.push({
                id: 'strategy-signals',
                category: 'strategy',
                name: 'Strategy Signal Generation',
                status: 'fail',
                message: '❌ Strategy does not return proper entry/direction arrays',
                critical: true,
                solution: 'Ensure your strategy_logic function returns {"entry": [...], "direction": [...]} arrays.',
                icon: <XCircle className="h-4 w-4" />
              });
            }
          }
        } catch (error: any) {
          results.push({
            id: 'strategy-signals',
            category: 'strategy',
            name: 'Strategy Signal Generation',
            status: 'fail',
            message: `❌ Strategy test failed: ${error.message}`,
            critical: true,
            solution: 'Fix Python errors in your strategy code.',
            icon: <XCircle className="h-4 w-4" />
          });
        }
      }
    } else {
      results.push({
        id: 'strategy-selected',
        category: 'strategy',
        name: 'Strategy Selection',
        status: 'fail',
        message: '❌ No strategy selected',
        critical: true,
        solution: 'Select a strategy from your saved strategies or create a new one.',
        icon: <XCircle className="h-4 w-4" />
      });
    }

    // OANDA CONFIGURATION
    const hasOANDACredentials = config.accountId && config.apiKey;
    if (hasOANDACredentials) {
      results.push({
        id: 'oanda-config',
        category: 'oanda',
        name: 'OANDA Configuration',
        status: 'pass',
        message: `✅ OANDA configured for ${config.environment} (${config.accountId})`,
        critical: true,
        icon: <Settings className="h-4 w-4" />
      });

      // Test OANDA connection
      try {
        await testOANDAConnection(config);
        results.push({
          id: 'oanda-connection',
          category: 'oanda',
          name: 'OANDA API Connection',
          status: 'pass',
          message: '✅ OANDA API connection successful',
          critical: true,
          icon: <Wifi className="h-4 w-4" />
        });
      } catch (error: any) {
        results.push({
          id: 'oanda-connection',
          category: 'oanda',
          name: 'OANDA API Connection',
          status: 'fail',
          message: `❌ OANDA connection failed: ${error.message}`,
          critical: true,
          solution: 'Check your Account ID and API Token. Ensure they are correct and active.',
          icon: <XCircle className="h-4 w-4" />
        });
      }
    } else {
      results.push({
        id: 'oanda-config',
        category: 'oanda',
        name: 'OANDA Configuration',
        status: 'fail',
        message: '❌ OANDA credentials not configured',
        critical: true,
        solution: 'Enter your OANDA Account ID and API Token in the configuration section.',
        icon: <XCircle className="h-4 w-4" />
      });
    }

    // SERVER-SIDE TRADING SESSIONS
    try {
      const sessions = await ServerForwardTestingService.getActiveSessions();
      if (sessions.length > 0) {
        results.push({
          id: 'server-sessions',
          category: 'server',
          name: '24/7 Server Trading Sessions',
          status: 'pass',
          message: `✅ ${sessions.length} active server-side trading sessions`,
          critical: false,
          icon: <Database className="h-4 w-4" />
        });
      } else {
        results.push({
          id: 'server-sessions',
          category: 'server',
          name: '24/7 Server Trading Sessions',
          status: 'warning',
          message: '⚠️ No active server-side trading sessions',
          critical: false,
          solution: 'Start forward testing to enable 24/7 server-side trading.',
          icon: <AlertTriangle className="h-4 w-4" />
        });
      }
    } catch (error: any) {
      results.push({
        id: 'server-sessions',
        category: 'server',
        name: '24/7 Server Trading Sessions',
        status: 'fail',
        message: `❌ Cannot check server sessions: ${error.message}`,
        critical: false,
        solution: 'Server communication issue. Check your internet connection.',
        icon: <XCircle className="h-4 w-4" />
      });
    }

    // TRADING PERMISSIONS & RISK MANAGEMENT
    results.push({
      id: 'trading-environment',
      category: 'trading',
      name: 'Trading Environment Safety',
      status: config.environment === 'practice' ? 'pass' : 'warning',
      message: config.environment === 'practice' 
        ? '✅ Using practice environment (safe for testing)'
        : '⚠️ LIVE environment - real money at risk!',
      critical: false,
      solution: config.environment === 'live' ? 'Consider using practice environment first to test your strategy.' : undefined,
      icon: config.environment === 'practice' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />
    });

    // BROWSER KEEPALIVE STATUS
    const keepaliveActive = (window as any).browserKeepalive?.getStatus()?.isActive || false;
    results.push({
      id: 'browser-keepalive',
      category: 'system',
      name: 'Browser 24/7 Keepalive',
      status: keepaliveActive ? 'pass' : 'warning',
      message: keepaliveActive 
        ? '✅ Browser keepalive active for continuous monitoring'
        : '⚠️ Browser keepalive not active',
      critical: false,
      solution: keepaliveActive ? undefined : 'Browser keepalive will start automatically when forward testing begins.',
      icon: keepaliveActive ? <Zap className="h-4 w-4" /> : <Clock className="h-4 w-4" />
    });

    setDiagnostics(results);

    // Calculate overall status
    const criticalFailures = results.filter(r => r.critical && r.status === 'fail');
    const warnings = results.filter(r => r.status === 'warning');
    
    if (criticalFailures.length > 0) {
      setOverallStatus('critical');
    } else if (warnings.length > 0) {
      setOverallStatus('warning');
    } else {
      setOverallStatus('ready');
    }

    setIsRunning(false);
  };

  useEffect(() => {
    runComprehensiveDiagnostics();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-500/10 text-green-400">PASS</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-400">WARNING</Badge>;
      case 'fail':
        return <Badge className="bg-red-500/10 text-red-400">FAIL</Badge>;
      case 'checking':
        return <Badge className="bg-blue-500/10 text-blue-400">CHECKING</Badge>;
      default:
        return null;
    }
  };

  const getOverallStatusDisplay = () => {
    switch (overallStatus) {
      case 'ready':
        return { color: 'text-green-400', message: '✅ System Ready for Forward Testing' };
      case 'warning':
        return { color: 'text-yellow-400', message: '⚠️ System Functional with Warnings' };
      case 'critical':
        return { color: 'text-red-400', message: '❌ Critical Issues - Forward Testing Blocked' };
      case 'checking':
        return { color: 'text-blue-400', message: '🔍 Running Diagnostics...' };
    }
  };

  const groupedDiagnostics = {
    python: diagnostics.filter(d => d.category === 'python'),
    strategy: diagnostics.filter(d => d.category === 'strategy'),
    oanda: diagnostics.filter(d => d.category === 'oanda'),
    server: diagnostics.filter(d => d.category === 'server'),
    trading: diagnostics.filter(d => d.category === 'trading'),
    system: diagnostics.filter(d => d.category === 'system')
  };

  const overallDisplay = getOverallStatusDisplay();

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Forward Testing Comprehensive Diagnostics
          </div>
          <Button 
            onClick={runComprehensiveDiagnostics} 
            disabled={isRunning}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? 'Checking...' : 'Run Full Diagnostics'}
          </Button>
        </CardTitle>
        <div className={`${overallDisplay.color} font-medium`}>
          {overallDisplay.message}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Python Engine Section */}
        {groupedDiagnostics.python.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">🐍 Python Strategy Engine</h3>
            <div className="space-y-2">
              {groupedDiagnostics.python.map(item => (
                <div key={item.id} className="flex items-start justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    {item.icon}
                    <div>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-sm text-slate-300">{item.message}</div>
                      {item.solution && (
                        <div className="text-sm text-blue-300 mt-1">💡 {item.solution}</div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategy Section */}
        {groupedDiagnostics.strategy.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">📈 Strategy Configuration</h3>
            <div className="space-y-2">
              {groupedDiagnostics.strategy.map(item => (
                <div key={item.id} className="flex items-start justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    {item.icon}
                    <div>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-sm text-slate-300">{item.message}</div>
                      {item.solution && (
                        <div className="text-sm text-blue-300 mt-1">💡 {item.solution}</div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OANDA Section */}
        {groupedDiagnostics.oanda.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">🏦 OANDA Trading Platform</h3>
            <div className="space-y-2">
              {groupedDiagnostics.oanda.map(item => (
                <div key={item.id} className="flex items-start justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    {item.icon}
                    <div>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-sm text-slate-300">{item.message}</div>
                      {item.solution && (
                        <div className="text-sm text-blue-300 mt-1">💡 {item.solution}</div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Server & 24/7 Operations */}
        {groupedDiagnostics.server.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">🖥️ 24/7 Server Operations</h3>
            <div className="space-y-2">
              {groupedDiagnostics.server.map(item => (
                <div key={item.id} className="flex items-start justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    {item.icon}
                    <div>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-sm text-slate-300">{item.message}</div>
                      {item.solution && (
                        <div className="text-sm text-blue-300 mt-1">💡 {item.solution}</div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trading Safety & System */}
        {(groupedDiagnostics.trading.length > 0 || groupedDiagnostics.system.length > 0) && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">🛡️ Trading Safety & System</h3>
            <div className="space-y-2">
              {[...groupedDiagnostics.trading, ...groupedDiagnostics.system].map(item => (
                <div key={item.id} className="flex items-start justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    {item.icon}
                    <div>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-sm text-slate-300">{item.message}</div>
                      {item.solution && (
                        <div className="text-sm text-blue-300 mt-1">💡 {item.solution}</div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="bg-slate-600" />
        
        <div className="text-xs text-slate-400 text-center">
          Last check: {new Date().toLocaleString()} • {diagnostics.length} diagnostics completed
        </div>
      </CardContent>
    </Card>
  );
};

export default ComprehensiveForwardTestingDiagnostics;
