
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OANDAConfig } from '@/types/oanda';

export const useOANDAConfig = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [config, setConfig] = useState<OANDAConfig>(() => {
    const saved = localStorage.getItem('oanda_config');
    return saved ? JSON.parse(saved) : {
      accountId: '',
      apiKey: '',
      environment: 'practice',
      enabled: false
    };
  });

  const handleConfigChange = (field: keyof OANDAConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    localStorage.setItem('oanda_config', JSON.stringify(newConfig));
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

    toast({
      title: "Configuration Loaded",
      description: `Loaded configuration: ${savedConfig.config_name}`,
    });
  };

  return {
    config,
    savedConfigs,
    isLoading,
    handleConfigChange,
    handleSaveConfig,
    handleLoadConfig,
    loadSavedConfigs
  };
};
