
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Activity, Pause, Play, TrendingUp, Clock, Target } from 'lucide-react';
import { useOANDAPriceMonitor } from '@/hooks/oanda/useOANDAPriceMonitor';
import { OANDAConfig, StrategySettings } from '@/types/oanda';

interface OANDAPriceMonitorControlProps {
  config: OANDAConfig;
  strategy: StrategySettings | null;
  isConfigured: boolean;
  connectionStatus: string;
}

const OANDAPriceMonitorControl: React.FC<OANDAPriceMonitorControlProps> = ({
  config,
  strategy,
  isConfigured,
  connectionStatus
}) => {
  const {
    isMonitoring,
    latestResult,
    signalHistory,
    startMonitoring,
    stopMonitoring,
    clearHistory
  } = useOANDAPriceMonitor();

  const canStartMonitoring = isConfigured && 
                            strategy && 
                            connectionStatus === 'success' && 
                            !isMonitoring;

  // Debug logging for button state
  console.log('🔍 PriceMonitorControl Debug State:', {
    isConfigured,
    strategy: strategy?.name || 'null',
    connectionStatus,
    isMonitoring,
    canStartMonitoring,
    config: {
      accountId: config.accountId ? 'SET' : 'NOT_SET',
      apiKey: config.apiKey ? 'SET' : 'NOT_SET',
      environment: config.environment
    }
  });

  const handleToggleMonitoring = async () => {
    console.log('🎯 Monitor Button Clicked!', {
      action: isMonitoring ? 'STOP' : 'START',
      canStartMonitoring,
      isMonitoring,
      strategy: strategy?.name,
      timestamp: new Date().toISOString()
    });

    if (isMonitoring) {
      console.log('🛑 Stopping monitoring...');
      stopMonitoring();
    } else if (strategy) {
      console.log('▶️ Starting monitoring...', {
        symbol: strategy.symbol,
        accountId: config.accountId,
        environment: config.environment
      });
      try {
        await startMonitoring(config, strategy);
        console.log('✅ Monitoring started successfully');
      } catch (error) {
        console.error('❌ Failed to start monitoring:', error);
      }
    } else {
      console.warn('⚠️ Cannot start monitoring: No strategy selected');
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Real-Time Price Monitor
          </div>
          <div className="flex items-center gap-2">
            {isMonitoring && (
              <Badge variant="default" className="bg-emerald-600">
                <Activity className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Debug Info Panel */}
        <div className="bg-slate-700/30 p-3 rounded-lg text-xs">
          <h4 className="text-slate-300 font-medium mb-1">Debug Info (Check Console for More)</h4>
          <div className="space-y-1 text-slate-400">
            <div>Button Clickable: {canStartMonitoring || isMonitoring ? '✅ YES' : '❌ NO'}</div>
            <div>Monitoring: {isMonitoring ? '✅ Active' : '❌ Stopped'}</div>
            <div>Strategy: {strategy?.name || '❌ None'}</div>
            <div>Connection: {connectionStatus}</div>
          </div>
        </div>

        {/* Monitor Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-400">Status</span>
            </div>
            <span className="text-white font-medium">
              {isMonitoring ? 'Monitoring' : 'Stopped'}
            </span>
          </div>

          <div className="bg-slate-700/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-400">Symbol</span>
            </div>
            <span className="text-white font-medium">
              {strategy?.symbol || 'No Strategy'}
            </span>
          </div>

          <div className="bg-slate-700/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-400">Signals Found</span>
            </div>
            <span className="text-white font-medium">
              {signalHistory.length}
            </span>
          </div>
        </div>

        <Separator className="bg-slate-600" />

        {/* Latest Result */}
        {latestResult && (
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <h4 className="text-white font-medium mb-2">Latest Check</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Time:</span>
                <span className="text-white ml-2">
                  {new Date(latestResult.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Price:</span>
                <span className="text-white ml-2">
                  {latestResult.currentPrice.toFixed(5)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Signal:</span>
                <span className={`ml-2 font-medium ${
                  latestResult.signalGenerated 
                    ? latestResult.signalType === 'BUY' 
                      ? 'text-emerald-400' 
                      : 'text-red-400'
                    : 'text-slate-400'
                }`}>
                  {latestResult.signalGenerated 
                    ? `${latestResult.signalType} (${(latestResult.confidence * 100).toFixed(1)}%)`
                    : 'No Signal'
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Signal History */}
        {signalHistory.length > 0 && (
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <h4 className="text-white font-medium mb-2">Recent Signals</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {signalHistory.slice(-5).reverse().map((signal, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    {new Date(signal.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`font-medium ${
                    signal.signalType === 'BUY' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {signal.signalType} @ {signal.currentPrice.toFixed(5)}
                  </span>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="mt-2 text-xs border-slate-600 text-slate-300"
            >
              Clear History
            </Button>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              console.log('🖱️ Button Click Event Triggered', {
                canStartMonitoring,
                isMonitoring,
                disabled: !canStartMonitoring && !isMonitoring
              });
              handleToggleMonitoring();
            }}
            disabled={!canStartMonitoring && !isMonitoring}
            className={`flex-1 ${
              isMonitoring 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isMonitoring ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Monitoring
              </>
            )}
          </Button>
        </div>

        {/* Requirements Check */}
        {!canStartMonitoring && !isMonitoring && (
          <div className="text-sm text-slate-400 space-y-1">
            <p>Requirements to start monitoring:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li className={isConfigured ? 'text-emerald-400' : ''}>
                OANDA credentials configured {isConfigured ? '✅' : '❌'}
              </li>
              <li className={strategy ? 'text-emerald-400' : ''}>
                Strategy selected {strategy ? '✅' : '❌'}
              </li>
              <li className={connectionStatus === 'success' ? 'text-emerald-400' : ''}>
                Successful connection test {connectionStatus === 'success' ? '✅' : '❌'}
              </li>
            </ul>
          </div>
        )}

        <div className="text-xs text-slate-500 text-center">
          Monitor checks for signals every 60 seconds using live OANDA data
        </div>
      </CardContent>
    </Card>
  );
};

export default OANDAPriceMonitorControl;
