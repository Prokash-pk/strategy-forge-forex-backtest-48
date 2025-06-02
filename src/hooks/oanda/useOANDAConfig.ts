
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { OANDAConfig } from '@/types/oanda';

const defaultConfig: OANDAConfig = {
  accountId: '',
  apiKey: '',
  environment: 'practice'
};

export const useOANDAConfig = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [config, setConfig] = useState<OANDAConfig>(defaultConfig);
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
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
          environment: data.environment as 'practice' | 'live'
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
      setSavedConfigs(data || []);
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
        enabled: true
      };

      const { error } = await supabase
        .from('oanda_configs')
        .insert([configToSave]);

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

  const handleLoadConfig = async (configId: string) => {
    try {
      const { data, error } = await supabase
        .from('oanda_configs')
        .select('*')
        .eq('id', configId)
        .single();

      if (error) throw error;

      if (data) {
        setConfig({
          accountId: data.account_id,
          apiKey: data.api_key,
          environment: data.environment as 'practice' | 'live'
        });

        toast({
          title: "Configuration Loaded",
          description: "OANDA configuration loaded successfully",
        });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      toast({
        title: "Load Failed",
        description: "Could not load OANDA configuration",
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
    handleLoadConfig,
    loadSavedConfigs
  };
};
