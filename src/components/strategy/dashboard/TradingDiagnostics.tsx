
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Search, Database, Activity } from 'lucide-react';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';

interface TradingDiagnosticsProps {
  strategy: any;
}

const TradingDiagnostics: React.FC<TradingDiagnosticsProps> = ({ strategy }) => {
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Running Forward Testing Diagnostics...');
      
      // Check for active sessions
      const activeSessions = await ServerForwardTestingService.getActiveSessions();
      console.log('Active Sessions:', activeSessions);
      
      // Check trading logs
      const tradingLogs = await ServerForwardTestingService.getTradingLogs();
      console.log('Trading Logs:', tradingLogs);
      
      // Check localStorage for any stored strategy trades
      const storedTrades = localStorage.getItem('forward_testing_trades');
      const parsedTrades = storedTrades ? JSON.parse(storedTrades) : [];
      console.log('LocalStorage Trades:', parsedTrades);
      
      // Check for strategy results in localStorage
      const strategyResults = localStorage.getItem('backtest_results');
      const parsedResults = strategyResults ? JSON.parse(strategyResults) : null;
      console.log('Strategy Results:', parsedResults);
      
      // Check selected strategy settings
      const selectedStrategy = localStorage.getItem('selected_strategy_settings');
      const parsedStrategy = selectedStrategy ? JSON.parse(selectedStrategy) : null;
      console.log('Selected Strategy:', parsedStrategy);
      
      setDiagnosticData({
        activeSessions,
        tradingLogs,
        localStorageTrades: parsedTrades,
        strategyResults: parsedResults,
        selectedStrategy: parsedStrategy,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Diagnostics error:', error);
      setDiagnosticData({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700 w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base">
          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          Forward Testing Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-sm">
            Investigate why strategy trades aren't showing in forward testing
          </p>
          <Button
            onClick={runDiagnostics}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Analyzing...' : 'Run Diagnostics'}
          </Button>
        </div>

        {diagnosticData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Active Sessions */}
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <span className="text-white text-sm font-medium">Server Sessions</span>
                </div>
                <Badge variant={diagnosticData.activeSessions?.length > 0 ? "default" : "destructive"}>
                  {diagnosticData.activeSessions?.length || 0} Active
                </Badge>
                <p className="text-xs text-slate-400 mt-1">
                  {diagnosticData.activeSessions?.length > 0 
                    ? 'Autonomous trading is running'
                    : 'No autonomous trading sessions found'
                  }
                </p>
              </div>

              {/* Trading Logs */}
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span className="text-white text-sm font-medium">Trading Logs</span>
                </div>
                <Badge variant={diagnosticData.tradingLogs?.length > 0 ? "default" : "secondary"}>
                  {diagnosticData.tradingLogs?.length || 0} Records
                </Badge>
                <p className="text-xs text-slate-400 mt-1">
                  Server-side execution logs
                </p>
              </div>

              {/* Local Storage Trades */}
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-yellow-400" />
                  <span className="text-white text-sm font-medium">Local Trades</span>
                </div>
                <Badge variant={diagnosticData.localStorageTrades?.length > 0 ? "default" : "secondary"}>
                  {diagnosticData.localStorageTrades?.length || 0} Stored
                </Badge>
                <p className="text-xs text-slate-400 mt-1">
                  Client-side stored trades
                </p>
              </div>

              {/* Strategy Match */}
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-purple-400" />
                  <span className="text-white text-sm font-medium">Strategy Match</span>
                </div>
                <Badge variant={
                  diagnosticData.selectedStrategy?.strategy_name === strategy?.strategy_name 
                    ? "default" 
                    : "destructive"
                }>
                  {diagnosticData.selectedStrategy?.strategy_name === strategy?.strategy_name 
                    ? 'Matched' 
                    : 'Mismatch'
                  }
                </Badge>
                <p className="text-xs text-slate-400 mt-1">
                  Selected: {diagnosticData.selectedStrategy?.strategy_name || 'None'}
                </p>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <h4 className="text-white text-sm font-medium mb-2">Diagnostic Details</h4>
              <div className="space-y-2 text-xs">
                {diagnosticData.error ? (
                  <p className="text-red-400">Error: {diagnosticData.error}</p>
                ) : (
                  <>
                    <p className="text-slate-300">
                      <span className="text-slate-400">Last Check:</span> {new Date(diagnosticData.timestamp).toLocaleString()}
                    </p>
                    {diagnosticData.activeSessions?.length > 0 && (
                      <p className="text-emerald-400">
                        ✅ Autonomous trading sessions detected - trades should be executing
                      </p>
                    )}
                    {diagnosticData.tradingLogs?.length === 0 && diagnosticData.activeSessions?.length > 0 && (
                      <p className="text-yellow-400">
                        ⚠️ Active sessions but no trading logs - possible execution issue
                      </p>
                    )}
                    {diagnosticData.localStorageTrades?.length === 0 && (
                      <p className="text-slate-400">
                        ℹ️ No local trades stored - this is normal for server-side autonomous trading
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingDiagnostics;
