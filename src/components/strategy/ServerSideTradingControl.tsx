
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Cloud, Server, Play, Square, Activity, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ServerForwardTestingService, type TradingSessionRecord } from '@/services/serverForwardTestingService';

interface ServerSideTradingControlProps {
  strategy?: any;
  config?: any;
  isConfigured?: boolean;
}

const ServerSideTradingControl: React.FC<ServerSideTradingControlProps> = ({
  strategy,
  config,
  isConfigured = false
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<TradingSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  useEffect(() => {
    if (user) {
      fetchActiveSessions();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchActiveSessions, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchActiveSessions = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const sessions = await ServerForwardTestingService.getActiveSessions();
      setActiveSessions(sessions);
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartServerSideTrading = async () => {
    if (!strategy || !config || !isConfigured || !user) {
      toast({
        title: "⚠️ Configuration Required",
        description: "Please configure your strategy and OANDA connection first",
        variant: "destructive",
      });
      return;
    }

    setIsStarting(true);
    try {
      console.log('🚀 Starting server-side trading for strategy:', strategy.strategy_name);
      
      const session = await ServerForwardTestingService.startServerSideForwardTesting(
        strategy, 
        config, 
        user.id
      );
      
      console.log('✅ Server session created successfully:', session.id);
      
      toast({
        title: "🚀 Server-Side Trading Started!",
        description: `Session for ${strategy.strategy_name} is now running 24/7 in the cloud`,
      });

      await fetchActiveSessions();

    } catch (error) {
      console.error('❌ Error starting server-side trading:', error);
      toast({
        title: "❌ Failed to Start",
        description: error instanceof Error ? error.message : "Could not start server-side trading session",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopServerSideTrading = async () => {
    if (!user) return;

    setIsStopping(true);
    try {
      console.log('⏹️ Stopping all server-side trading sessions...');
      
      await ServerForwardTestingService.stopServerSideForwardTesting(user.id);
      
      toast({
        title: "⏹️ Server-Side Trading Stopped",
        description: "All cloud trading sessions have been stopped",
      });

      await fetchActiveSessions();

    } catch (error) {
      console.error('❌ Error stopping server-side trading:', error);
      toast({
        title: "❌ Failed to Stop",
        description: "Could not stop server-side trading",
        variant: "destructive",
      });
    } finally {
      setIsStopping(false);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-emerald-600' : 'bg-red-600';
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  const hasActiveSessions = activeSessions.length > 0;
  const canStart = isConfigured && strategy && config && !hasActiveSessions && !isStarting;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Server-Side 24/7 Trading
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className={getStatusColor(hasActiveSessions)}>
              <Server className="h-3 w-3 mr-1" />
              {hasActiveSessions ? `${activeSessions.length} Active` : 'Offline'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActiveSessions}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Active Sessions Display */}
        {hasActiveSessions && (
          <div className="p-4 bg-slate-900 rounded-lg">
            <h3 className="text-emerald-400 font-medium mb-3">Active Sessions</h3>
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session.id} className="p-3 bg-slate-800 rounded border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{session.strategy_name}</span>
                    <Badge variant="default" className="bg-emerald-600">
                      <Activity className="h-3 w-3 mr-1" />
                      Running
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-400 space-y-1">
                    <div>Symbol: <span className="text-white">{session.symbol}</span></div>
                    <div>Timeframe: <span className="text-white">{session.timeframe}</span></div>
                    <div>Environment: <span className="text-white capitalize">{session.environment}</span></div>
                    <div>Started: <span className="text-white">{formatTime(session.created_at)}</span></div>
                    <div>Last Execution: <span className="text-white">{formatTime(session.last_execution)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="bg-slate-600" />

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

        {/* Strategy Info */}
        {strategy && (
          <div className="p-3 bg-slate-900/50 rounded border border-slate-600">
            <h4 className="text-white font-medium mb-2">Current Strategy</h4>
            <div className="text-sm text-slate-400 space-y-1">
              <div>Name: <span className="text-white">{strategy.strategy_name || 'Unnamed'}</span></div>
              <div>Symbol: <span className="text-white">{strategy.symbol || 'Not set'}</span></div>
              <div>Timeframe: <span className="text-white">{strategy.timeframe || 'Not set'}</span></div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleStartServerSideTrading}
            disabled={!canStart}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            {isStarting ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Starting Server Session...
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
            disabled={isStopping || !hasActiveSessions}
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
                Stop All Sessions
              </>
            )}
          </Button>
        </div>

        {/* Debug Info */}
        <div className="text-xs text-slate-500 bg-slate-900/30 p-3 rounded">
          <div className="mb-2 font-medium">Debug Info:</div>
          <div>User ID: {user?.id ? 'Set' : 'Missing'}</div>
          <div>Strategy: {strategy ? 'Loaded' : 'Missing'}</div>
          <div>Config: {config?.accountId ? 'Set' : 'Missing'}</div>
          <div>Is Configured: {isConfigured ? 'Yes' : 'No'}</div>
          <div>Active Sessions: {activeSessions.length}</div>
        </div>

        {/* Schedule Info */}
        <div className="text-xs text-slate-500 text-center bg-slate-900/30 p-2 rounded">
          <Clock className="h-3 w-3 inline mr-1" />
          Server execution: Every 5 minutes during market hours, 24/7
        </div>
      </CardContent>
    </Card>
  );
};

export default ServerSideTradingControl;
