
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OANDAConfig } from '@/types/oanda';

export const useOANDAConfig = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [config, setConfig] = useState<OANDAConfig>({
    accountId: '',
    apiKey: '',
    environment: 'practice',
    enabled: false
  });

  // Load config from localStorage on mount
  useEffect(() => {
    const loadConfigFromStorage = () => {
      try {
        const saved = localStorage.getItem('oanda_config');
        if (saved) {
          const parsedConfig = JSON.parse(saved);
          console.log('Loading OANDA config from localStorage:', parsedConfig);
          setConfig(parsedConfig);
        }
      } catch (error) {
        console.error('Failed to load config from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('oanda_config');
      }
    };

    loadConfigFromStorage();
    loadSavedConfigs();
  }, []);

  const handleConfigChange = (field: keyof OANDAConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    
    // Persist to localStorage immediately
    try {
      localStorage.setItem('oanda_config', JSON.stringify(newConfig));
      console.log('Saved OANDA config to localStorage:', newConfig);
    } catch (error) {
      console.error('Failed to save config to localStorage:', error);
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

      // Check if config already exists
      const { data: existingConfigs } = await supabase
        .from('oanda_configs')
        .select('id')
        .eq('user_id', user.id)
        .eq('account_id', config.accountId)
        .eq('environment', config.environment);

      if (existingConfigs && existingConfigs.length > 0) {
        // Update existing config
        const { error } = await supabase
          .from('oanda_configs')
          .update({
            api_key: config.apiKey,
            enabled: config.enabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfigs[0].id);

        if (error) throw error;

        toast({
          title: "Configuration Updated",
          description: `OANDA configuration "${configName}" has been updated`,
        });
      } else {
        // Insert new config
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
      }

      // Mark config as enabled after successful save
      const updatedConfig = { ...config, enabled: true };
      setConfig(updatedConfig);
      localStorage.setItem('oanda_config', JSON.stringify(updatedConfig));

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
    
    // Persist to localStorage
    try {
      localStorage.setItem('oanda_config', JSON.stringify(loadedConfig));
      console.log('Loaded and saved OANDA config:', loadedConfig);
    } catch (error) {
      console.error('Failed to save loaded config to localStorage:', error);
    }

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
