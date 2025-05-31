
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Settings, Play, Square, AlertTriangle, HelpCircle, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OANDAApiGuide from './OANDAApiGuide';

interface OANDAConfig {
  accountId: string;
  apiKey: string;
  environment: 'practice' | 'live';
  enabled: boolean;
  maxRiskPerTrade?: number;
  maxDailyTrades?: number;
  tradingHours?: {
    start: string;
    end: string;
  };
}

interface OANDAIntegrationProps {
  strategy: any;
  isForwardTestingActive: boolean;
  onToggleForwardTesting: (active: boolean) => void;
}

const OANDAIntegration: React.FC<OANDAIntegrationProps> = ({
  strategy,
  isForwardTestingActive,
  onToggleForwardTesting
}) => {
  const { toast } = useToast();
  const [showGuide, setShowGuide] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string>('');
  const [config, setConfig] = useState<OANDAConfig>(() => {
    const saved = localStorage.getItem('oanda_config');
    return saved ? JSON.parse(saved) : {
      accountId: '',
      apiKey: '',
      environment: 'practice',
      enabled: false,
      maxRiskPerTrade: 2,
      maxDailyTrades: 10,
      tradingHours: {
        start: '08:00',
        end: '17:00'
      }
    };
  });

  const handleConfigChange = (field: keyof OANDAConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    localStorage.setItem('oanda_config', JSON.stringify(newConfig));
    
    // Reset connection status when credentials change
    if (field === 'accountId' || field === 'apiKey' || field === 'environment') {
      setConnectionStatus('idle');
      setConnectionError('');
    }
  };

  const handleTestConnection = async () => {
    if (!config.accountId || !config.apiKey) {
      toast({
        title: "Missing Configuration",
        description: "Please enter both Account ID and API Key",
        variant: "destructive",
      });
      return;
    }

    setConnectionStatus('testing');
    setConnectionError('');

    try {
      // Test OANDA connection by trying to get account info
      const baseUrl = config.environment === 'practice' 
        ? 'https://api-fxpractice.oanda.com'
        : 'https://api-fxtrade.oanda.com';

      const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('success');
        toast({
          title: "Connection Successful! ✅",
          description: `Connected to ${config.environment} account: ${data.account?.alias || config.accountId}`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.errorMessage || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('OANDA connection test failed:', error);
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      setConnectionError(errorMessage);
      
      toast({
        title: "Connection Failed ❌",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleToggleForwardTesting = async () => {
    if (!isForwardTestingActive) {
      if (!config.accountId || !config.apiKey) {
        toast({
          title: "Configuration Required",
          description: "Please configure your OANDA API credentials first",
          variant: "destructive",
        });
        return;
      }

      if (connectionStatus !== 'success') {
        toast({
          title: "Test Connection First",
          description: "Please test your OANDA connection before starting forward testing",
          variant: "destructive",
        });
        return;
      }
    }
    
    onToggleForwardTesting(!isForwardTestingActive);
  };

  const isConfigured = config.accountId && config.apiKey;
  const canStartTesting = isConfigured && connectionStatus === 'success';

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5" />
                OANDA Forward Testing
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGuide(true)}
                className="border-slate-600 text-slate-300 hover:text-white"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Setup Guide
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Configuration Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="h-5 w-5" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Environment Selection */}
            <div className="space-y-2">
              <Label htmlFor="environment" className="text-slate-300">Environment</Label>
              <Select
                value={config.environment}
                onValueChange={(value: 'practice' | 'live') => handleConfigChange('environment', value)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="practice" className="text-white">
                    <div className="flex items-center gap-2">
                      <span>Practice (Demo)</span>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-xs">Recommended</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="live" className="text-white">
                    <div className="flex items-center gap-2">
                      <span>Live Trading</span>
                      <Badge variant="secondary" className="bg-red-500/10 text-red-400 text-xs">Advanced</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {config.environment === 'live' && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
                  <p className="text-red-300 text-sm">
                    Warning: Live trading involves real money. Only use this mode with thoroughly tested strategies.
                  </p>
                </div>
              )}
            </div>

            <Separator className="bg-slate-600" />

            {/* Account ID */}
            <div className="space-y-2">
              <Label htmlFor="accountId" className="text-slate-300">Account ID</Label>
              <Input
                id="accountId"
                type="text"
                placeholder="101-001-12345678-001"
                value={config.accountId}
                onChange={(e) => handleConfigChange('accountId', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-slate-300">API Token</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your OANDA API token"
                value={config.apiKey}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            {/* Connection Test */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleTestConnection}
                disabled={!config.accountId || !config.apiKey || connectionStatus === 'testing'}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:text-white"
              >
                {connectionStatus === 'testing' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
              
              {getConnectionStatusIcon()}
              
              {connectionStatus === 'success' && (
                <span className="text-emerald-400 text-sm">Connection verified</span>
              )}
              
              {connectionStatus === 'error' && (
                <span className="text-red-400 text-sm">Connection failed</span>
              )}
            </div>

            {connectionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-300 text-sm">{connectionError}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Management Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Risk Management Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Max Risk Per Trade (%)</Label>
                <Input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={config.maxRiskPerTrade}
                  onChange={(e) => handleConfigChange('maxRiskPerTrade', parseFloat(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Max Daily Trades</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={config.maxDailyTrades}
                  onChange={(e) => handleConfigChange('maxDailyTrades', parseInt(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Trading Hours (Singapore Time)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="time"
                  value={config.tradingHours?.start || '08:00'}
                  onChange={(e) => handleConfigChange('tradingHours', { ...config.tradingHours, start: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  type="time"
                  value={config.tradingHours?.end || '17:00'}
                  onChange={(e) => handleConfigChange('tradingHours', { ...config.tradingHours, end: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forward Testing Control */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              {isForwardTestingActive ? <Play className="h-5 w-5 text-emerald-400" /> : <Square className="h-5 w-5" />}
              Forward Testing Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">
                  Strategy: {strategy.name}
                </h3>
                <p className="text-slate-400 text-sm">
                  {strategy.symbol} • {strategy.timeframe}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={isForwardTestingActive ? "default" : "secondary"}
                  className={isForwardTestingActive ? "bg-emerald-600" : "bg-slate-600"}
                >
                  {isForwardTestingActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <Separator className="bg-slate-600" />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium mb-1">Forward Testing Status</h4>
                <p className="text-slate-400 text-sm">
                  {isForwardTestingActive 
                    ? `Running live on OANDA ${config.environment} account` 
                    : "Forward testing is currently stopped"
                  }
                </p>
                {canStartTesting && !isForwardTestingActive && (
                  <p className="text-emerald-400 text-sm mt-1">✅ Ready to start forward testing</p>
                )}
              </div>
              <Button
                onClick={handleToggleForwardTesting}
                disabled={!canStartTesting && !isForwardTestingActive}
                className={isForwardTestingActive 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-emerald-600 hover:bg-emerald-700"
                }
              >
                {isForwardTestingActive ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop Testing
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Testing
                  </>
                )}
              </Button>
            </div>

            {!canStartTesting && !isForwardTestingActive && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-amber-300 text-sm">
                    {!isConfigured 
                      ? "Please configure your OANDA API credentials above."
                      : connectionStatus !== 'success'
                      ? "Please test your connection first to verify credentials."
                      : "Ready to start forward testing!"
                    }
                  </p>
                  {!isConfigured && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowGuide(true)}
                      className="text-amber-400 hover:text-amber-300 p-0 h-auto mt-1"
                    >
                      View Setup Guide →
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ExternalLink className="h-5 w-5" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="ghost"
              onClick={() => window.open('https://www.oanda.com/demo-account/', '_blank')}
              className="text-slate-300 hover:text-white justify-start p-0"
            >
              Create OANDA Demo Account
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.open('https://developer.oanda.com/rest-live-v20/introduction/', '_blank')}
              className="text-slate-300 hover:text-white justify-start p-0"
            >
              OANDA API Documentation
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowGuide(true)}
              className="text-slate-300 hover:text-white justify-start p-0"
            >
              Step-by-Step Setup Guide
            </Button>
          </CardContent>
        </Card>
      </div>

      <OANDAApiGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </>
  );
};

export default OANDAIntegration;
