
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

export const useOANDAIntegration = () => {
  const { toast } = useToast();
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
          api_key: config.apiKey,
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
      const testSignal = {
        action: 'BUY' as const,
        symbol: selectedStrategy.symbol.replace('=X', '').replace('/', '_'),
        units: 100,
        stopLoss: undefined,
        takeProfit: undefined,
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

  const isConfigured = config.accountId && config.apiKey;
  const canStartTesting = isConfigured && connectionStatus === 'success' && selectedStrategy !== null;

  return {
    config,
    connectionStatus,
    connectionError,
    savedConfigs,
    savedStrategies,
    selectedStrategy,
    isLoading,
    isTestingTrade,
    isConfigured,
    canStartTesting,
    handleConfigChange,
    handleTestConnection,
    handleSaveConfig,
    handleLoadConfig,
    handleLoadStrategy,
    handleTestTrade,
    loadSelectedStrategy,
    loadSavedConfigs,
    loadSavedStrategies
  };
};
