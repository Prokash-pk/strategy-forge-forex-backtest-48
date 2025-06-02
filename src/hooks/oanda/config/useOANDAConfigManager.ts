
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { OANDAConfig, SavedOANDAConfig } from '@/types/oanda';

export const useOANDAConfigManager = (
  setConfig: (config: OANDAConfig) => void,
  resetConfig: () => void,
  savedConfigs: SavedOANDAConfig[],
  loadSavedConfigs: () => Promise<void>
) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleLoadConfig = async (savedConfig: SavedOANDAConfig) => {
    if (!user) return;

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
    if (!user) return;

    try {
      const { error } = await supabase
        .from('oanda_configs')
        .delete()
        .eq('id', configId);

      if (error) throw error;

      // If we deleted the currently active config, clear it
      const deletedConfig = savedConfigs.find(c => c.id === configId);
      if (deletedConfig?.enabled) {
        resetConfig();
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
    handleLoadConfig,
    handleDeleteConfig
  };
};
