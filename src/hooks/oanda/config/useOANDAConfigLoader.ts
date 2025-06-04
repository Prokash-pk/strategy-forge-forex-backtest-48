
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OANDAConfig } from '@/types/oanda';

export const useOANDAConfigLoader = (
  setConfig: (config: OANDAConfig) => void,
  setSavedConfigs: (configs: any[]) => void
) => {
  const loadLastUsedConfig = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First try to load from Supabase
      const { data: configs } = await supabase
        .from('oanda_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('enabled', true)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (configs && configs.length > 0) {
        const config = configs[0];
        const oandaConfig: OANDAConfig = {
          accountId: config.account_id,
          apiKey: config.api_key,
          environment: config.environment as 'practice' | 'live'
        };
        
        setConfig(oandaConfig);
        console.log('✅ Auto-loaded OANDA config from Supabase');
        return;
      }

      // Fallback to localStorage if no Supabase config
      const saved = localStorage.getItem('oanda_config');
      if (saved) {
        try {
          const config = JSON.parse(saved);
          setConfig(config);
          console.log('✅ Loaded OANDA config from localStorage');
        } catch (error) {
          console.error('Failed to parse saved OANDA config:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load OANDA config:', error);
    }
  }, [setConfig]);

  const loadSavedConfigs = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('oanda_configs')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading saved configs:', error);
        return;
      }

      setSavedConfigs(data || []);
      console.log(`✅ Loaded ${data?.length || 0} saved OANDA configs from Supabase`);
    } catch (error) {
      console.error('Failed to load saved configs:', error);
    }
  }, [setSavedConfigs]);

  return {
    loadLastUsedConfig,
    loadSavedConfigs
  };
};
