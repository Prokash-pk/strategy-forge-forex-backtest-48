
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SavedOANDAConfig } from '@/types/oanda';

export const useOANDAConfigManager = (
  setConfig: any,
  resetConfig: any,
  savedConfigs: SavedOANDAConfig[],
  loadSavedConfigs: () => Promise<void>
) => {
  const { toast } = useToast();

  const handleLoadConfig = (configToLoad: SavedOANDAConfig) => {
    console.log('Loading config:', configToLoad);
    setConfig({
      accountId: configToLoad.accountId,
      apiKey: configToLoad.apiKey,
      environment: configToLoad.environment,
      configName: configToLoad.configName,
      enabled: configToLoad.enabled
    });

    toast({
      title: "Configuration Loaded",
      description: `Loaded "${configToLoad.configName}" configuration`,
    });
  };

  const handleDeleteConfig = async (configId: string): Promise<void> => {
    try {
      console.log('Deleting config:', configId);
      
      const { error } = await supabase
        .from('oanda_configs')
        .delete()
        .eq('id', configId);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      // Reload saved configs to update the UI
      await loadSavedConfigs();

      toast({
        title: "Configuration Deleted",
        description: "Configuration has been successfully deleted",
      });
    } catch (error) {
      console.error('Failed to delete config:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete configuration. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    handleLoadConfig,
    handleDeleteConfig
  };
};
