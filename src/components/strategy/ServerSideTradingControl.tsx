
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Cloud, Server, Play, Square, Activity, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ServerSideTradingControlProps {
  strategy?: any;
  config?: any;
  isConfigured?: boolean;
}

interface TradingStatus {
  systemStatus: string;
  lastExecution: string;
  activeSessions: number;
  totalExecutions: number;
  serverTime: string;
  nextExecution: string;
}

const ServerSideTradingControl: React.FC<ServerSideTradingControlProps> = ({
  strategy,
  config,
  isConfigured = false
}) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<TradingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Poll trading status every 30 seconds
  useEffect(() => {
    fetchTradingStatus();
    const interval = setInterval(fetchTradingStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTradingStatus = async () => {
    try {
      const response = await fetch('/.netlify/functions/trading-status?action=status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch trading status:', error);
    }
  };

  const handleStartServerSideTrading = async () => {
    if (!strategy || !config || !isConfigured) {
      toast({
        title: "⚠️ Configuration Required",
        description: "Please configure your strategy and OANDA connection first",
        variant: "destructive",
      });
      return;
    }

    setIsStarting(true);
    try {
      const sessionData = {
        strategy_code: strategy.code,
        strategy_name: strategy.name,
        symbol: strategy.symbol,
        timeframe: strategy.timeframe,
        oanda_account_id: config.accountId,
        oanda_api_key: config.apiKey,
        environment: config.environment,
        risk_per_trade: strategy.riskPerTrade || 2.0,
        stop_loss: strategy.stopLoss || 40,
        take_profit: strategy.takeProfit || 80,
        reverse_signals: strategy.reverseSignals || false
      };

      const response = await fetch('/.netlify/functions/trading-status?action=start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "🚀 Server-Side Trading Started!",
          description: `Session ${result.sessionId} is now running 24/7 in the cloud`,
        });

        await fetchTradingStatus();
      } else {
        throw new Error('Failed to start trading session');
      }

    } catch (error) {
      console.error('Error starting server-side trading:', error);
      toast({
        title: "❌ Failed to Start",
        description: "Could not start server-side trading session",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopServerSideTrading = async () => {
    setIsStopping(true);
    try {
      const response = await fetch('/.netlify/functions/trading-status?action=stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'current' })
      });

      if (response.ok) {
        toast({
          title: "⏹️ Server-Side Trading Stopped",
          description: "All cloud trading sessions have been stopped",
        });

        await fetchTradingStatus();
      }

    } catch (error) {
      console.error('Error stopping server-side trading:', error);
      toast({
        title: "❌ Failed to Stop",
        description: "Could not stop server-side trading",
        variant: "destructive",
      });
    } finally {
      setIsStopping(false);
    }
  };

  const getStatusColor = (systemStatus: string) => {
    switch (systemStatus) {
      case 'ONLINE': return 'bg-emerald-600';
      case 'OFFLINE': return 'bg-red-600';
      default: return 'bg-amber-600';
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString();
  };

  const getTimeUntilNext = (nextExecution: string) => {
    const now = new Date();
    const next = new Date(nextExecution);
    const diff = Math.max(0, next.getTime() - now.getTime());
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Server-Side 24/7 Trading
          </div>
          {status && (
            <Badge variant="default" className={getStatusColor(status.systemStatus)}>
              <Server className="h-3 w-3 mr-1" />
              {status.systemStatus}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* System Status */}
        {status && (
          <div className="p-4 bg-slate-900 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{status.activeSessions}</div>
                <div className="text-sm text-slate-400">Active Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{status.totalExecutions}</div>
                <div className="text-sm text-slate-400">Total Executions</div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Last Execution:</span>
                <span className="text-white">{formatTime(status.lastExecution)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Next Execution:</span>
                <span className="text-emerald-400">{getTimeUntilNext(status.nextExecution)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Server Time:</span>
                <span className="text-white">{formatTime(status.serverTime)}</span>
              </div>
            </div>
          </div>
        )}

        <Separator className="bg-slate-600" />

        {/* Benefits */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Server-Side Benefits</span>
          </div>
          <ul className="text-slate-400 text-sm space-y-1">
            <li>• Runs 24/7 automatically in Netlify cloud</li>
            <li>• No browser dependency - executes server-side</li>
            <li>• Automatic reconnection and error handling</li>
            <li>• Executes every 5 minutes precisely</li>
            <li>• Global availability and reliability</li>
          </ul>
        </div>

        {/* Configuration Check */}
        {!isConfigured && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-amber-400 font-medium">Setup Required</span>
            </div>
            <p className="text-slate-400 text-sm">
              Configure your OANDA connection and strategy in the other tabs first.
            </p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleStartServerSideTrading}
            disabled={!isConfigured || isStarting || status?.activeSessions > 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {isStarting ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start 24/7 Trading
              </>
            )}
          </Button>

          <Button
            onClick={handleStopServerSideTrading}
            disabled={isStopping || !status?.activeSessions}
            variant="destructive"
            className="flex-1"
          >
            {isStopping ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Stopping...
              </>
            ) : (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Trading
              </>
            )}
          </Button>
        </div>

        {/* Schedule Info */}
        <div className="text-xs text-slate-500 text-center">
          <Clock className="h-3 w-3 inline mr-1" />
          Scheduled execution: Every 5 minutes, 24/7
        </div>
      </CardContent>
    </Card>
  );
};

export default ServerSideTradingControl;
