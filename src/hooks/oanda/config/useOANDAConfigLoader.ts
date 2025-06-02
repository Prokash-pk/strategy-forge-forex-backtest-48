
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { OANDAConfig, SavedOANDAConfig } from '@/types/oanda';

export const useOANDAConfigLoader = (
  setConfig: (config: OANDAConfig) => void,
  setSavedConfigs: (configs: SavedOANDAConfig[]) => void
) => {
  const { user } = useAuth();

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

  return {
    loadLastUsedConfig,
    loadSavedConfigs
  };
};
