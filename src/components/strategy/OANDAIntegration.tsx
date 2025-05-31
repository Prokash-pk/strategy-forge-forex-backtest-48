import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Settings, Play, Square, AlertTriangle, HelpCircle, Save, Upload, CheckCircle, XCircle, Loader2, BarChart3, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import OANDAApiGuide from './OANDAApiGuide';

interface OANDAConfig {
  accountId: string;
  apiKey: string;
  environment: 'practice' | 'live';
  enabled: boolean;
}

interface StrategySettings {
  id: string;
  strategy_name: string;
  strategy_code: string;
  symbol: string;
  timeframe: string;
  initial_balance: number;
  risk_per_trade: number;
  stop_loss: number;
  take_profit: number;
  spread: number;
  commission: number;
  slippage: number;
  max_position_size: number;
  risk_model: string;
  reverse_signals: boolean;
  position_sizing_mode: string;
  risk_reward_ratio: number;
  win_rate?: number;
  total_trades?: number;
  total_return?: number;
  profit_factor?: number;
  max_drawdown?: number;
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
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [savedStrategies, setSavedStrategies] = useState<StrategySettings[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategySettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingTrade, setIsTestingTrade] = useState(false);
  const [config, setConfig] = useState<OANDAConfig>(() => {
    const saved = localStorage.getItem('oanda_config');
    return saved ? JSON.parse(saved) : {
      accountId: '',
      apiKey: '',
      environment: 'practice',
      enabled: false
    };
  });

  React.useEffect(() => {
    loadSavedConfigs();
    loadSavedStrategies();
    loadSelectedStrategy();
  }, []);

  const loadSelectedStrategy = () => {
    const saved = localStorage.getItem('selected_strategy_settings');
    if (saved) {
      try {
        const strategySettings = JSON.parse(saved);
        setSelectedStrategy(strategySettings);
      } catch (error) {
        console.error('Failed to load selected strategy:', error);
      }
    }
  };

  const loadSavedConfigs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('oanda_configs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedConfigs(data || []);
    } catch (error) {
      console.error('Failed to load saved configs:', error);
    }
  };

  const loadSavedStrategies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('strategy_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedStrategies(data || []);
    } catch (error) {
      console.error('Failed to load saved strategies:', error);
    }
  };

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

  const handleSaveConfig = async () => {
    if (!config.accountId || !config.apiKey) {
      toast({
        title: "Missing Configuration",
        description: "Please enter both Account ID and API Key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const configName = `${config.environment.toUpperCase()} - ${config.accountId.slice(-8)}`;

      const { error } = await supabase
        .from('oanda_configs')
        .insert({
          user_id: user.id,
          config_name: configName,
          account_id: config.accountId,
          api_key: config.apiKey, // In production, encrypt this
          environment: config.environment,
          enabled: config.enabled
        });

      if (error) throw error;

      toast({
        title: "Configuration Saved",
        description: `OANDA configuration "${configName}" has been saved`,
      });

      loadSavedConfigs();

    } catch (error) {
      console.error('Save config error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadConfig = (savedConfig: any) => {
    const loadedConfig = {
      accountId: savedConfig.account_id,
      apiKey: savedConfig.api_key,
      environment: savedConfig.environment,
      enabled: savedConfig.enabled
    };

    setConfig(loadedConfig);
    localStorage.setItem('oanda_config', JSON.stringify(loadedConfig));
    setConnectionStatus('idle');
    setConnectionError('');

    toast({
      title: "Configuration Loaded",
      description: `Loaded configuration: ${savedConfig.config_name}`,
    });
  };

  const handleLoadStrategy = (strategySettings: StrategySettings) => {
    // Ensure all properties are properly loaded
    const completeStrategy: StrategySettings = {
      id: strategySettings.id,
      strategy_name: strategySettings.strategy_name,
      strategy_code: strategySettings.strategy_code,
      symbol: strategySettings.symbol,
      timeframe: strategySettings.timeframe,
      initial_balance: strategySettings.initial_balance || 10000,
      risk_per_trade: strategySettings.risk_per_trade || 1,
      stop_loss: strategySettings.stop_loss || 40,
      take_profit: strategySettings.take_profit || 80,
      spread: strategySettings.spread || 1.5,
      commission: strategySettings.commission || 0,
      slippage: strategySettings.slippage || 0.5,
      max_position_size: strategySettings.max_position_size || 100000,
      risk_model: strategySettings.risk_model || 'fixed',
      reverse_signals: strategySettings.reverse_signals || false,
      position_sizing_mode: strategySettings.position_sizing_mode || 'manual',
      risk_reward_ratio: strategySettings.risk_reward_ratio || 2,
      win_rate: strategySettings.win_rate,
      total_trades: strategySettings.total_trades,
      total_return: strategySettings.total_return,
      profit_factor: strategySettings.profit_factor,
      max_drawdown: strategySettings.max_drawdown
    };

    setSelectedStrategy(completeStrategy);
    localStorage.setItem('selected_strategy_settings', JSON.stringify(completeStrategy));
    
    toast({
      title: "Strategy Settings Loaded",
      description: `Loaded strategy: ${completeStrategy.strategy_name} with all settings`,
    });
  };

  const handleTestTrade = async () => {
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
        description: "Please test your OANDA connection before executing a test trade",
        variant: "destructive",
      });
      return;
    }

    if (!selectedStrategy) {
      toast({
        title: "Strategy Required",
        description: "Please select a strategy with saved settings to use for the test trade",
        variant: "destructive",
      });
      return;
    }

    setIsTestingTrade(true);

    try {
      // Create a small test trade using the selected strategy settings
      const testSignal = {
        action: 'BUY' as const,
        symbol: selectedStrategy.symbol.replace('=X', '').replace('/', '_'), // Convert to OANDA format
        units: 100, // Small test position
        stopLoss: undefined, // Optional for test
        takeProfit: undefined, // Optional for test
        strategyId: selectedStrategy.id,
        userId: 'test-user'
      };

      const oandaConfig = {
        accountId: config.accountId,
        apiKey: config.apiKey,
        environment: config.environment
      };

      console.log('Executing test trade:', testSignal);
      
      const response = await supabase.functions.invoke('oanda-trade-executor', {
        body: {
          signal: testSignal,
          config: oandaConfig
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Trade execution failed');
      }

      if (response.data?.success) {
        toast({
          title: "Test Trade Successful! ✅",
          description: `Test ${testSignal.action} order for ${testSignal.units} units of ${testSignal.symbol} executed successfully`,
        });
        
        console.log('Test trade result:', response.data.result);
      } else {
        throw new Error(response.data?.error || 'Trade execution failed');
      }

    } catch (error) {
      console.error('Test trade error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Test Trade Failed ❌",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTestingTrade(false);
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

      if (!selectedStrategy) {
        toast({
          title: "Strategy Required",
          description: "Please select a strategy with saved settings before starting forward testing",
          variant: "destructive",
        });
        return;
      }
    }
    
    onToggleForwardTesting(!isForwardTestingActive);
  };

  const isConfigured = config.accountId && config.apiKey;
  const canStartTesting = isConfigured && connectionStatus === 'success' && selectedStrategy;

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

        {/* Saved Configurations */}
        {savedConfigs.length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Upload className="h-5 w-5" />
                Saved API Configurations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {savedConfigs.map((savedConfig) => (
                <div key={savedConfig.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">{savedConfig.config_name}</h4>
                    <p className="text-slate-400 text-sm">
                      {savedConfig.environment} • Account: {savedConfig.account_id.slice(-8)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadConfig(savedConfig)}
                    className="border-slate-600 text-slate-300 hover:text-white"
                  >
                    Load
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Strategy Settings Selection */}
        {savedStrategies.length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="h-5 w-5" />
                Strategy Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-400 text-sm">
                Select a saved strategy with specific settings for forward testing. The trades will be executed based on these settings.
              </p>
              
              {selectedStrategy && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <h4 className="text-emerald-400 font-medium mb-3">{selectedStrategy.strategy_name}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-300">
                    <div>
                      <span className="text-slate-400">Symbol:</span>
                      <div className="font-medium">{selectedStrategy.symbol}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Timeframe:</span>
                      <div className="font-medium">{selectedStrategy.timeframe}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Initial Balance:</span>
                      <div className="font-medium">${selectedStrategy.initial_balance?.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Risk per Trade:</span>
                      <div className="font-medium">{selectedStrategy.risk_per_trade}%</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Stop Loss:</span>
                      <div className="font-medium">{selectedStrategy.stop_loss} pips</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Take Profit:</span>
                      <div className="font-medium">{selectedStrategy.take_profit} pips</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Risk/Reward:</span>
                      <div className="font-medium">{selectedStrategy.risk_reward_ratio}:1</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Max Position:</span>
                      <div className="font-medium">{selectedStrategy.max_position_size?.toLocaleString()}</div>
                    </div>
                    {selectedStrategy.win_rate && (
                      <div>
                        <span className="text-slate-400">Win Rate:</span>
                        <div className="font-medium text-emerald-400">{selectedStrategy.win_rate.toFixed(1)}%</div>
                      </div>
                    )}
                    {selectedStrategy.total_return && (
                      <div>
                        <span className="text-slate-400">Total Return:</span>
                        <div className={`font-medium ${selectedStrategy.total_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {selectedStrategy.total_return >= 0 ? '+' : ''}{selectedStrategy.total_return.toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {selectedStrategy.profit_factor && (
                      <div>
                        <span className="text-slate-400">Profit Factor:</span>
                        <div className="font-medium">{selectedStrategy.profit_factor.toFixed(2)}</div>
                      </div>
                    )}
                    {selectedStrategy.max_drawdown && (
                      <div>
                        <span className="text-slate-400">Max Drawdown:</span>
                        <div className="font-medium text-red-400">{selectedStrategy.max_drawdown.toFixed(1)}%</div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant={selectedStrategy.reverse_signals ? "destructive" : "secondary"} className="text-xs">
                      {selectedStrategy.reverse_signals ? "Reverse Signals" : "Normal Signals"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedStrategy.position_sizing_mode}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedStrategy.risk_model}
                    </Badge>
                  </div>
                </div>
              )}
              
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {savedStrategies.map((strategySettings) => (
                  <div key={strategySettings.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{strategySettings.strategy_name}</h4>
                      <p className="text-slate-400 text-sm">
                        {strategySettings.symbol} • {strategySettings.timeframe} • Risk: {strategySettings.risk_per_trade}%
                        {strategySettings.win_rate && ` • Win Rate: ${strategySettings.win_rate.toFixed(1)}%`}
                        {strategySettings.total_return && (
                          <span className={strategySettings.total_return >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {' '}• Return: {strategySettings.total_return >= 0 ? '+' : ''}{strategySettings.total_return.toFixed(1)}%
                          </span>
                        )}
                      </p>
                      <p className="text-slate-500 text-xs">
                        SL: {strategySettings.stop_loss} | TP: {strategySettings.take_profit} | R/R: {strategySettings.risk_reward_ratio}:1
                      </p>
                    </div>
                    <Button
                      variant={selectedStrategy?.id === strategySettings.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleLoadStrategy(strategySettings)}
                      className={selectedStrategy?.id === strategySettings.id 
                        ? "bg-emerald-600 hover:bg-emerald-700" 
                        : "border-slate-600 text-slate-300 hover:text-white"
                      }
                    >
                      {selectedStrategy?.id === strategySettings.id ? "Selected" : "Select"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Configuration Card */}
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

            {/* Action Buttons */}
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

              <Button
                onClick={handleSaveConfig}
                disabled={!isConfigured || isLoading}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Config
                  </>
                )}
              </Button>

              <Button
                onClick={handleTestTrade}
                disabled={!canStartTesting || isTestingTrade || isForwardTestingActive}
                variant="outline"
                className="border-blue-600 text-blue-300 hover:text-blue-200 disabled:opacity-50"
              >
                {isTestingTrade ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Trade...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Trade
                  </>
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
                  Strategy: {selectedStrategy ? selectedStrategy.strategy_name : "No strategy selected"}
                </h3>
                <p className="text-slate-400 text-sm">
                  {selectedStrategy ? `${selectedStrategy.symbol} • ${selectedStrategy.timeframe}` : "Please select a strategy above"}
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
                    ? `Running live on OANDA ${config.environment} account with ${selectedStrategy?.strategy_name}` 
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
                      : !selectedStrategy
                      ? "Please select a strategy with saved settings above."
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
      </div>

      <OANDAApiGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </>
  );
};

export default OANDAIntegration;
