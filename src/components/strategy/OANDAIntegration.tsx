
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Settings, Play, Square } from 'lucide-react';

interface OANDAConfig {
  accountId: string;
  apiKey: string;
  environment: 'practice' | 'live';
  enabled: boolean;
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
  const [config, setConfig] = useState<OANDAConfig>({
    accountId: '',
    apiKey: '',
    environment: 'practice',
    enabled: false
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleTestConnection = async () => {
    if (!config.accountId || !config.apiKey) {
      toast({
        title: "Missing Configuration",
        description: "Please enter both Account ID and API Key",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      const baseUrl = config.environment === 'practice' 
        ? 'https://api-fxpractice.oanda.com'
        : 'https://api-fxtrade.oanda.com';

      // Test connection by fetching account details
      const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        }
      });

      if (response.ok) {
        setIsConnected(true);
        toast({
          title: "Connection Successful",
          description: `Connected to OANDA ${config.environment} account`,
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStartForwardTesting = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please test connection first",
        variant: "destructive",
      });
      return;
    }

    // Save OANDA config to secure storage (you might want to encrypt this)
    localStorage.setItem('oanda_config', JSON.stringify(config));
    
    onToggleForwardTesting(true);
    
    toast({
      title: "Forward Testing Started",
      description: "Your strategy is now running live on OANDA demo account",
    });
  };

  const handleStopForwardTesting = () => {
    onToggleForwardTesting(false);
    
    toast({
      title: "Forward Testing Stopped",
      description: "Strategy execution has been halted",
    });
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5" />
          OANDA Forward Testing
          {isForwardTestingActive && (
            <Badge className="bg-green-600">LIVE</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="accountId" className="text-slate-300">Account ID</Label>
            <Input
              id="accountId"
              type="text"
              value={config.accountId}
              onChange={(e) => setConfig(prev => ({ ...prev, accountId: e.target.value }))}
              placeholder="101-001-12345678-001"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label htmlFor="apiKey" className="text-slate-300">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="Your OANDA API Key"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="environment" className="text-slate-300">Environment</Label>
          <Select 
            value={config.environment} 
            onValueChange={(value: 'practice' | 'live') => setConfig(prev => ({ ...prev, environment: value }))}
          >
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="practice" className="text-white">Practice (Demo)</SelectItem>
              <SelectItem value="live" className="text-white">Live</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-4 border border-slate-600 rounded-lg bg-slate-800/50">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-white">
              Auto-Execute Trades
            </Label>
            <p className="text-xs text-slate-400">
              Automatically execute trades based on strategy signals
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleTestConnection}
            disabled={isConnecting || !config.accountId || !config.apiKey}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full mr-2"></div>
                Testing...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>

          {!isForwardTestingActive ? (
            <Button
              onClick={handleStartForwardTesting}
              disabled={!isConnected || !config.enabled}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Forward Testing
            </Button>
          ) : (
            <Button
              onClick={handleStopForwardTesting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Forward Testing
            </Button>
          )}
        </div>

        {isConnected && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ <strong>Connected to OANDA {config.environment} account</strong>
            </p>
          </div>
        )}

        {isForwardTestingActive && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              🚀 <strong>Forward Testing Active:</strong> Strategy "{strategy.name}" is running live and will execute trades automatically based on signals.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OANDAIntegration;
