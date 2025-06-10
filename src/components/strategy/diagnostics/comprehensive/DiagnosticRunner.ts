import { DiagnosticItem } from './types';
import { User } from '@supabase/supabase-js';
import { PythonExecutor } from '@/services/pythonExecutor';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { testOANDAConnection } from '@/contexts/oanda/connectionUtils';
import React from 'react';
import { 
  Code, 
  Play, 
  XCircle, 
  CheckCircle, 
  Settings, 
  Wifi, 
  Database,
  AlertTriangle,
  Shield,
  Zap,
  Clock
} from 'lucide-react';

export class DiagnosticRunner {
  static async runPythonDiagnostics(): Promise<DiagnosticItem[]> {
    const results: DiagnosticItem[] = [];

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
          icon: React.createElement(Code, { className: 'h-4 w-4' })
        });

        // Test Python execution
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
            icon: React.createElement(Play, { className: 'h-4 w-4' })
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
            icon: React.createElement(XCircle, { className: 'h-4 w-4' })
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
          icon: React.createElement(XCircle, { className: 'h-4 w-4' })
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
        icon: React.createElement(XCircle, { className: 'h-4 w-4' })
      });
    }

    return results;
  }

  static async runStrategyDiagnostics(selectedStrategy: any): Promise<DiagnosticItem[]> {
    const results: DiagnosticItem[] = [];

    if (selectedStrategy) {
      results.push({
        id: 'strategy-selected',
        category: 'strategy',
        name: 'Strategy Selection',
        status: 'pass',
        message: `✅ Strategy selected: ${selectedStrategy.strategy_name}`,
        critical: true,
        icon: React.createElement(Settings, { className: 'h-4 w-4' })
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
          icon: React.createElement(Code, { className: 'h-4 w-4' })
        });

        // Test strategy signal generation
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
              icon: React.createElement(XCircle, { className: 'h-4 w-4' })
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
                icon: signalCount > 0 ? React.createElement(CheckCircle, { className: 'h-4 w-4' }) : React.createElement(AlertTriangle, { className: 'h-4 w-4' })
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
                icon: React.createElement(XCircle, { className: 'h-4 w-4' })
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
            icon: React.createElement(XCircle, { className: 'h-4 w-4' })
          });
        }
      } else {
        results.push({
          id: 'strategy-code',
          category: 'strategy',
          name: 'Strategy Code Quality',
          status: 'fail',
          message: '❌ Strategy code is missing or incomplete',
          critical: true,
          solution: 'Add valid Python strategy code with strategy_logic function that returns entry/exit signals.',
          icon: React.createElement(XCircle, { className: 'h-4 w-4' })
        });
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
        icon: React.createElement(XCircle, { className: 'h-4 w-4' })
      });
    }

    return results;
  }

  static async runOANDADiagnostics(config: any): Promise<DiagnosticItem[]> {
    const results: DiagnosticItem[] = [];

    const hasOANDACredentials = config.accountId && config.apiKey;
    if (hasOANDACredentials) {
      results.push({
        id: 'oanda-config',
        category: 'oanda',
        name: 'OANDA Configuration',
        status: 'pass',
        message: `✅ OANDA configured for ${config.environment} (${config.accountId})`,
        critical: true,
        icon: React.createElement(Settings, { className: 'h-4 w-4' })
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
          icon: React.createElement(Wifi, { className: 'h-4 w-4' })
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
          icon: React.createElement(XCircle, { className: 'h-4 w-4' })
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
        icon: React.createElement(XCircle, { className: 'h-4 w-4' })
      });
    }

    return results;
  }

  static async runServerDiagnostics(): Promise<DiagnosticItem[]> {
    const results: DiagnosticItem[] = [];

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
          icon: React.createElement(Database, { className: 'h-4 w-4' })
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
          icon: React.createElement(AlertTriangle, { className: 'h-4 w-4' })
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
        icon: React.createElement(XCircle, { className: 'h-4 w-4' })
      });
    }

    return results;
  }

  static runSystemDiagnostics(user: User | null, config: any): DiagnosticItem[] {
    const results: DiagnosticItem[] = [];

    // User Authentication
    results.push({
      id: 'user-auth',
      category: 'system',
      name: 'User Authentication',
      status: user ? 'pass' : 'fail',
      message: user ? `✅ Authenticated as ${user.email}` : '❌ User not authenticated',
      critical: true,
      solution: user ? undefined : 'Please log in to your account to enable trading features.',
      icon: React.createElement(Shield, { className: 'h-4 w-4' })
    });

    // Trading Environment Safety
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
      icon: config.environment === 'practice' ? React.createElement(CheckCircle, { className: 'h-4 w-4' }) : React.createElement(AlertTriangle, { className: 'h-4 w-4' })
    });

    // Browser Keepalive Status
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
      icon: keepaliveActive ? React.createElement(Zap, { className: 'h-4 w-4' }) : React.createElement(Clock, { className: 'h-4 w-4' })
    });

    return results;
  }
}
