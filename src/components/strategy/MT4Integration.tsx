
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { MT4IntegrationService, MT4Config } from '@/services/mt4IntegrationService';
import { Settings, Wifi, WifiOff, Play, Square, TestTube } from 'lucide-react';

const MT4Integration: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<MT4Config>(MT4IntegrationService.getConfig());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isConnected, setIsConnected] = useState(MT4IntegrationService.isConnectedToMT4());

  const handleConfigChange = (key: keyof MT4Config, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await MT4IntegrationService.connect(config);
      setIsConnected(true);
      toast({
        title: "Connected to MT4! ✅",
        description: "Successfully connected to MetaTrader 4 bridge",
      });
    } catch (error) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed ❌",
        description: error instanceof Error ? error.message : "Failed to connect to MT4",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    MT4IntegrationService.disconnect();
    setIsConnected(false);
    toast({
      title: "Disconnected",
      description: "Disconnected from MetaTrader 4",
    });
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await MT4IntegrationService.testConnection();
      toast({
        title: result.success ? "Test Successful ✅" : "Test Failed ❌",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Test Error",
        description: "Failed to test MT4 connection",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Settings className="h-5 w-5" />
          MetaTrader 4 Integration
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className={`p-3 rounded-lg border ${
          isConnected 
            ? 'bg-green-500/10 border-green-500/20' 
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${
              isConnected ? 'text-green-300' : 'text-red-300'
            }`}>
              {isConnected ? '🟢 Connected to MT4' : '🔴 Not Connected'}
            </span>
            <div className="flex gap-2">
              {isConnected ? (
                <>
                  <Button
                    onClick={handleTest}
                    disabled={isTesting}
                    size="sm"
                    variant="outline"
                    className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                  >
                    {isTesting ? (
                      <div className="animate-spin h-3 w-3 border border-blue-400 border-t-transparent rounded-full mr-1" />
                    ) : (
                      <TestTube className="h-3 w-3 mr-1" />
                    )}
                    Test
                  </Button>
                  <Button
                    onClick={handleDisconnect}
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                  >
                    <Square className="h-3 w-3 mr-1" />
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isConnecting ? (
                    <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full mr-1" />
                  ) : (
                    <Play className="h-3 w-3 mr-1" />
                  )}
                  Connect
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Connection Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Connection Settings</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="host" className="text-slate-300">Host</Label>
              <Input
                id="host"
                value={config.host}
                onChange={(e) => handleConfigChange('host', e.target.value)}
                placeholder="localhost"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="port" className="text-slate-300">Port</Label>
              <Input
                id="port"
                type="number"
                value={config.port}
                onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                placeholder="9090"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-slate-600" />

        {/* Trading Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Trading Settings</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lotSize" className="text-slate-300">Default Lot Size</Label>
              <Input
                id="lotSize"
                type="number"
                step="0.01"
                value={config.defaultLotSize}
                onChange={(e) => handleConfigChange('defaultLotSize', parseFloat(e.target.value))}
                placeholder="0.1"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="maxRisk" className="text-slate-300">Max Risk %</Label>
              <Input
                id="maxRisk"
                type="number"
                step="0.1"
                value={config.maxRisk}
                onChange={(e) => handleConfigChange('maxRisk', parseFloat(e.target.value))}
                placeholder="2.0"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoTrading" className="text-slate-300">Enable Auto Trading</Label>
              <p className="text-xs text-slate-400">Automatically execute signals from backtests</p>
            </div>
            <Switch
              id="autoTrading"
              checked={config.autoTrading}
              onCheckedChange={(checked) => handleConfigChange('autoTrading', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isEnabled" className="text-slate-300">MT4 Integration Enabled</Label>
              <p className="text-xs text-slate-400">Master switch for all MT4 functionality</p>
            </div>
            <Switch
              id="isEnabled"
              checked={config.isEnabled}
              onCheckedChange={(checked) => handleConfigChange('isEnabled', checked)}
            />
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h4 className="text-blue-300 font-medium mb-2">📋 Setup Instructions</h4>
          <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
            <li>Download DWX_ZeroMQ bridge from GitHub</li>
            <li>Place the EA files in your MT4/Experts folder</li>
            <li>Restart MT4 and attach the bridge EA to any chart</li>
            <li>Enable "Allow automated trading" in MT4 settings</li>
            <li>Configure the port (default: 9090) in the EA settings</li>
            <li>Click "Connect" above to establish connection</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default MT4Integration;
