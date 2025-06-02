
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

  // Load config from localStorage and database on mount
  useEffect(() => {
    const loadConfig = async () => {
      // First try localStorage for immediate availability
      try {
        const saved = localStorage.getItem('oanda_config');
        if (saved) {
          const parsedConfig = JSON.parse(saved);
          console.log('Loading OANDA config from localStorage:', parsedConfig);
          setConfig(parsedConfig);
        }
      } catch (error) {
        console.error('Failed to load config from localStorage:', error);
        localStorage.removeItem('oanda_config');
      }

      // Then load from database for authenticated users
      await loadConfigFromDatabase();
      await loadSavedConfigs();
    };

    loadConfig();
  }, []);

  const loadConfigFromDatabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load the most recent enabled config for this user
      const { data, error } = await supabase
        .from('oanda_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('enabled', true)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const dbConfig = data[0];
        const loadedConfig = {
          accountId: dbConfig.account_id,
          apiKey: dbConfig.api_key,
          environment: dbConfig.environment,
          enabled: dbConfig.enabled
        };

        setConfig(loadedConfig);
        
        // Also save to localStorage for faster future loads
        localStorage.setItem('oanda_config', JSON.stringify(loadedConfig));
        console.log('Auto-loaded OANDA config from database:', {
          accountId: loadedConfig.accountId,
          environment: loadedConfig.environment,
          enabled: loadedConfig.enabled
        });

        toast({
          title: "OANDA Configuration Loaded",
          description: `Automatically loaded your ${loadedConfig.environment} account configuration`,
        });
      }
    } catch (error) {
      console.error('Failed to load config from database:', error);
    }
  };

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

      // Disable all other configs for this user first
      await supabase
        .from('oanda_configs')
        .update({ enabled: false })
        .eq('user_id', user.id);

      // Check if config already exists
      const { data: existingConfigs } = await supabase
        .from('oanda_configs')
        .select('id')
        .eq('user_id', user.id)
        .eq('account_id', config.accountId)
        .eq('environment', config.environment);

      if (existingConfigs && existingConfigs.length > 0) {
        // Update existing config and enable it
        const { error } = await supabase
          .from('oanda_configs')
          .update({
            api_key: config.apiKey,
            enabled: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfigs[0].id);

        if (error) throw error;

        toast({
          title: "Configuration Updated & Auto-Save Enabled",
          description: `OANDA configuration "${configName}" will be automatically loaded on future logins`,
        });
      } else {
        // Insert new config as enabled
        const { error } = await supabase
          .from('oanda_configs')
          .insert({
            user_id: user.id,
            config_name: configName,
            account_id: config.accountId,
            api_key: config.apiKey,
            environment: config.environment,
            enabled: true
          });

        if (error) throw error;

        toast({
          title: "Configuration Saved & Auto-Save Enabled",
          description: `OANDA configuration "${configName}" will be automatically loaded on future logins`,
        });
      }

      // Mark config as enabled in local state
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
    loadSavedConfigs,
    loadConfigFromDatabase
  };
};
