
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, HelpCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import OANDAApiGuide from './OANDAApiGuide';
import OANDAConfigForm from './OANDAConfigForm';
import OANDASavedConfigs from './OANDASavedConfigs';
import OANDAStrategySettings from './OANDAStrategySettings';
import OANDAForwardTestingControl from './OANDAForwardTestingControl';

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
        <OANDASavedConfigs 
          savedConfigs={savedConfigs}
          onLoadConfig={handleLoadConfig}
        />

        {/* Strategy Settings Selection */}
        <OANDAStrategySettings
          savedStrategies={savedStrategies}
          selectedStrategy={selectedStrategy}
          onLoadStrategy={handleLoadStrategy}
        />

        {/* API Configuration Card */}
        <OANDAConfigForm
          config={config}
          onConfigChange={handleConfigChange}
          onTestConnection={handleTestConnection}
          onSaveConfig={handleSaveConfig}
          onTestTrade={handleTestTrade}
          connectionStatus={connectionStatus}
          connectionError={connectionError}
          isLoading={isLoading}
          isTestingTrade={isTestingTrade}
          canStartTesting={canStartTesting}
          isForwardTestingActive={isForwardTestingActive}
          connectionStatusIcon={getConnectionStatusIcon()}
        />

        {/* Forward Testing Control */}
        <OANDAForwardTestingControl
          isForwardTestingActive={isForwardTestingActive}
          selectedStrategy={selectedStrategy}
          config={config}
          canStartTesting={canStartTesting}
          isConfigured={isConfigured}
          connectionStatus={connectionStatus}
          onToggleForwardTesting={handleToggleForwardTesting}
          onShowGuide={() => setShowGuide(true)}
        />
      </div>

      <OANDAApiGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </>
  );
};

export default OANDAIntegration;
