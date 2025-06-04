
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { OANDAConfig } from '@/types/oanda';

export const useOANDAConfigSaver = (
  config: OANDAConfig,
  setIsLoading: (loading: boolean) => void,
  loadSavedConfigs: () => Promise<void>
) => {
  const { toast } = useToast();
  const { user } = useAuth();

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
        enabled: false // Don't make it active by default - preserve existing active config
      };

      const { error } = await supabase
        .from('oanda_configs')
        .insert(configToSave);

      if (error) throw error;

      toast({
        title: "✅ Account Added",
        description: `"${configWithName.configName}" has been added to your saved configurations.`,
      });

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

  return {
    handleSaveConfig,
    handleSaveNewConfig
  };
};
