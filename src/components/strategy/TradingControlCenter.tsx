import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Server, 
  Monitor, 
  Activity, 
  Cloud, 
  Play, 
  Square, 
  Settings,
  RefreshCw,
  Wifi,
  AlertTriangle,
  Bug
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ServerForwardTestingService, type TradingSessionRecord } from '@/services/serverForwardTestingService';
import OANDATradingDashboard from './dashboard/OANDATradingDashboard';
import BrowserKeepaliveControl from './BrowserKeepaliveControl';
import ForwardTestingDiagnostic from './ForwardTestingDiagnostic';
import TradingDebugPanel from './TradingDebugPanel';

interface TradingControlCenterProps {
  strategy?: any;
  config?: any;
  isConfigured?: boolean;
  isForwardTestingActive?: boolean;
  onToggleForwardTesting?: () => Promise<boolean> | boolean;
  connectionStatus?: string;
}

const TradingControlCenter: React.FC<TradingControlCenterProps> = ({
  strategy,
  config,
  isConfigured = false,
  isForwardTestingActive = false,
  onToggleForwardTesting,
  connectionStatus = 'idle'
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<TradingSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [localForwardTestingActive, setLocalForwardTestingActive] = useState(isForwardTestingActive);

  // Sync with parent state
  useEffect(() => {
    setLocalForwardTestingActive(isForwardTestingActive);
  }, [isForwardTestingActive]);

  useEffect(() => {
    if (user) {
      fetchActiveSessions();
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
    console.log('🚀 BUTTON CLICKED: Start 24/7 Trading');
    console.log('📊 Current state:', { 
      strategy: strategy?.strategy_name, 
      config: config?.environment,
      isConfigured, 
      user: user?.id,
      isStarting 
    });

    if (!strategy || !config || !isConfigured || !user || isStarting) {
      console.log('❌ Validation failed');
      toast({
        title: "⚠️ Configuration Required",
        description: "Please configure your strategy and OANDA connection first",
        variant: "destructive",
      });
      return;
    }

    setIsStarting(true);
    
    try {
      console.log('🚀 Calling ServerForwardTestingService.startServerSideForwardTesting...');
      
      const session = await ServerForwardTestingService.startServerSideForwardTesting(
        strategy, 
        config, 
        user.id
      );
      
      console.log('✅ ✅ ✅ SUCCESS! Server-side session created:', session);
      
      toast({
        title: "🚀 Server-Side Trading Started!",
        description: `Session for ${strategy.strategy_name} is now running 24/7 in the cloud`,
      });

      await fetchActiveSessions();
      
    } catch (error) {
      console.error('❌ ❌ ❌ COMPLETE FAILURE starting server-side trading:', error);
      
      let errorMessage = "Could not start server-side trading session";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      toast({
        title: "❌ Failed to Start",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
      console.log('🏁 Start process completed, isStarting reset to false');
    }
  };

  const handleStopServerSideTrading = async () => {
    if (!user || isStopping) return;

    setIsStopping(true);
    
    try {
      console.log('⏹️ Stopping server-side trading...');
      
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

  const handleToggleForwardTesting = async () => {
    if (!onToggleForwardTesting) {
      console.warn('onToggleForwardTesting prop not provided');
      toast({
        title: "⚠️ Function Not Available",
        description: "Browser trading toggle is not configured",
        variant: "destructive",
      });
      return;
    }

    if (!isConfigured || !strategy) {
      toast({
        title: "⚠️ Configuration Required",
        description: "Please configure your strategy and OANDA connection first",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🔄 Toggling browser trading...', localForwardTestingActive ? 'STOP' : 'START');
      
      const result = await onToggleForwardTesting();
      
      // Update local state based on result
      if (typeof result === 'boolean') {
        setLocalForwardTestingActive(result);
      } else {
        // Toggle the current state if no explicit result
        setLocalForwardTestingActive(!localForwardTestingActive);
      }
      
      toast({
        title: localForwardTestingActive ? "⏹️ Browser Trading Stopped" : "🚀 Browser Trading Started",
        description: localForwardTestingActive 
          ? "Browser-based trading has been stopped" 
          : "Browser-based trading is now active",
      });

    } catch (error) {
      console.error('❌ Error toggling forward testing:', error);
      toast({
        title: "❌ Toggle Failed",
        description: "Could not toggle browser trading",
        variant: "destructive",
      });
    }
  };

  const hasActiveSessions = activeSessions.length > 0;
  const isConnected = connectionStatus === 'success';
  const combinedTradingActive = localForwardTestingActive || hasActiveSessions;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trading Control Center
          </div>
          <div className="flex items-center gap-2">
            {combinedTradingActive && (
              <Badge variant="default" className="bg-emerald-600">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Trading Active
              </Badge>
            )}
            {isConnected && (
              <Badge variant="default" className="bg-blue-600">
                <Wifi className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
            {!isConfigured && (
              <Badge variant="secondary" className="bg-slate-600">
                <Settings className="h-3 w-3 mr-1" />
                Setup Required
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActiveSessions}
              disabled={isLoading}
              className="border-slate-600 text-slate-300 hover:text-white"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="server-trading" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-700">
            <TabsTrigger value="server-trading" className="data-[state=active]:bg-slate-600">
              <Server className="h-4 w-4 mr-2" />
              24/7 Server
            </TabsTrigger>
            <TabsTrigger value="browser-trading" className="data-[state=active]:bg-slate-600">
              <Monitor className="h-4 w-4 mr-2" />
              Browser Trading
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-600">
              <Activity className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="data-[state=active]:bg-slate-600">
              <Settings className="h-4 w-4 mr-2" />
              Diagnostics
            </TabsTrigger>
            <TabsTrigger value="debug" className="data-[state=active]:bg-slate-600">
              <Bug className="h-4 w-4 mr-2" />
              Debug
            </TabsTrigger>
          </TabsList>

          <TabsContent value="server-trading" className="mt-6 space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-600">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                24/7 Server-Side Trading
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Execute trades on our servers 24/7. No need to keep your browser open.
              </p>

              {hasActiveSessions && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded">
                  <h4 className="text-emerald-400 font-medium mb-2">Active Sessions</h4>
                  {activeSessions.map((session) => (
                    <div key={session.id} className="text-sm text-slate-300">
                      <div>{session.strategy_name} - {session.symbol}</div>
                      <div className="text-xs text-slate-400">
                        Started: {new Date(session.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isConfigured && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-amber-400 font-medium">Setup Required</span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Configure your OANDA connection and strategy first.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleStartServerSideTrading}
                  disabled={!isConfigured || hasActiveSessions || isStarting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
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
            </div>
          </TabsContent>

          <TabsContent value="browser-trading" className="mt-6 space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-600">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Browser-Based Live Trading
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Execute trades directly from your browser. Requires keeping the browser tab open.
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={localForwardTestingActive ? "default" : "secondary"} 
                         className={localForwardTestingActive ? "bg-emerald-600" : "bg-slate-600"}>
                    {localForwardTestingActive ? "Active" : "Inactive"}
                  </Badge>
                  {strategy && (
                    <span className="text-sm text-slate-400">
                      Strategy: {strategy.strategy_name}
                    </span>
                  )}
                </div>
                
                <Button
                  onClick={handleToggleForwardTesting}
                  disabled={!isConfigured}
                  className={localForwardTestingActive 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-emerald-600 hover:bg-emerald-700"
                  }
                >
                  {localForwardTestingActive ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Trading
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Trading
                    </>
                  )}
                </Button>
              </div>
            </div>

            <BrowserKeepaliveControl />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6">
            <OANDATradingDashboard
              isActive={combinedTradingActive}
              strategy={strategy}
              environment={config?.environment || 'practice'}
              oandaConfig={config}
              onToggleForwardTesting={handleToggleForwardTesting}
            />
          </TabsContent>

          <TabsContent value="diagnostics" className="mt-6">
            <ForwardTestingDiagnostic />
          </TabsContent>

          <TabsContent value="debug" className="mt-6">
            <TradingDebugPanel 
              strategy={strategy} 
              config={config} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TradingControlCenter;
