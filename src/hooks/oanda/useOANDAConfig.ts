
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { OANDAConfig, SavedOANDAConfig } from '@/types/oanda';

const defaultConfig: OANDAConfig = {
  accountId: '',
  apiKey: '',
  environment: 'practice',
  enabled: false
};

export const useOANDAConfig = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [config, setConfig] = useState<OANDAConfig>(defaultConfig);
  const [savedConfigs, setSavedConfigs] = useState<SavedOANDAConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-load saved config on mount
  useEffect(() => {
    if (user) {
      loadSavedConfigs();
      loadLastUsedConfig();
    }
  }, [user]);

  const loadLastUsedConfig = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('oanda_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('enabled', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setConfig({
          accountId: data.account_id,
          apiKey: data.api_key,
          environment: data.environment as 'practice' | 'live',
          enabled: data.enabled,
          configName: data.config_name
        });
        
        console.log('Auto-loaded OANDA config for user');
      }
    } catch (error) {
      console.log('No saved config found, using defaults');
    }
  };

  const loadSavedConfigs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('oanda_configs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedConfigs: SavedOANDAConfig[] = (data || []).map(item => ({
        id: item.id,
        accountId: item.account_id,
        apiKey: item.api_key,
        environment: item.environment as 'practice' | 'live',
        enabled: item.enabled,
        configName: item.config_name,
        createdAt: item.created_at
      }));
      
      setSavedConfigs(formattedConfigs);
    } catch (error) {
      console.error('Failed to load saved configs:', error);
    }
  };

  const handleConfigChange = (field: keyof OANDAConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveConfig = async () => {
    if (!user || !config.accountId || !config.apiKey) {
      toast({
        title: "Configuration Required",
        description: "Please fill in all required fields before saving",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // First, disable all existing configs for this user
      await supabase
        .from('oanda_configs')
        .update({ enabled: false })
        .eq('user_id', user.id);

      // Then save the new config as enabled
      const configToSave = {
        user_id: user.id,
        account_id: config.accountId,
        api_key: config.apiKey,
        environment: config.environment,
        config_name: config.configName || `${config.environment} - ${new Date().toLocaleDateString()}`,
        enabled: true
      };

      const { error } = await supabase
        .from('oanda_configs')
        .insert(configToSave);

      if (error) throw error;

      toast({
        title: "✅ Configuration Saved",
        description: "Your OANDA configuration has been saved and will be auto-loaded on future logins.",
      });

      // Reload saved configs to show the new one
      await loadSavedConfigs();

    } catch (error) {
      console.error('Failed to save config:', error);
      toast({
        title: "Save Failed",
        description: "Could not save OANDA configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNewConfig = async (configWithName: OANDAConfig & { configName: string }) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const configToSave = {
        user_id: user.id,
        account_id: configWithName.accountId,
        api_key: configWithName.apiKey,
        environment: configWithName.environment,
        config_name: configWithName.configName,
        enabled: false // Don't make it active by default
      };

      const { error } = await supabase
        .from('oanda_configs')
        .insert(configToSave);

      if (error) throw error;

      // Reload saved configs to show the new one
      await loadSavedConfigs();

    } catch (error) {
      console.error('Failed to save new config:', error);
      toast({
        title: "Save Failed",
        description: "Could not save OANDA configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadConfig = async (savedConfig: SavedOANDAConfig) => {
    try {
      // First, disable all existing configs for this user
      await supabase
        .from('oanda_configs')
        .update({ enabled: false })
        .eq('user_id', user.id);

      // Then enable the selected config
      await supabase
        .from('oanda_configs')
        .update({ enabled: true })
        .eq('id', savedConfig.id);

      // Update local state
      setConfig({
        accountId: savedConfig.accountId,
        apiKey: savedConfig.apiKey,
        environment: savedConfig.environment,
        enabled: true,
        configName: savedConfig.configName
      });

      // Reload saved configs to update UI
      await loadSavedConfigs();

      toast({
        title: "Configuration Loaded",
        description: `"${savedConfig.configName}" is now active`,
      });
    } catch (error) {
      console.error('Failed to load config:', error);
      toast({
        title: "Load Failed",
        description: "Could not load OANDA configuration",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    try {
      const { error } = await supabase
        .from('oanda_configs')
        .delete()
        .eq('id', configId);

      if (error) throw error;

      // If we deleted the currently active config, clear it
      const deletedConfig = savedConfigs.find(c => c.id === configId);
      if (deletedConfig?.enabled) {
        setConfig(defaultConfig);
      }

      // Reload saved configs
      await loadSavedConfigs();

    } catch (error) {
      console.error('Failed to delete config:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete OANDA configuration",
        variant: "destructive",
      });
    }
  };

  return {
    config,
    savedConfigs,
    isLoading,
    handleConfigChange,
    handleSaveConfig,
    handleSaveNewConfig,
    handleLoadConfig,
    handleDeleteConfig,
    loadSavedConfigs
  };
};
