
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OANDAConfig } from '@/types/oanda';

export const useOANDAConfigLoader = (
  setConfig: (config: OANDAConfig) => void,
  setSavedConfigs: (configs: any[]) => void
) => {
  // Use refs to track loading state and prevent duplicate calls
  const isLoadingConfigRef = useRef(false);
  const isLoadingSavedConfigsRef = useRef(false);

  const loadLastUsedConfig = useCallback(async () => {
    if (isLoadingConfigRef.current) return;
    isLoadingConfigRef.current = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If no user, try to load from localStorage as fallback
        const saved = localStorage.getItem('oanda_config');
        if (saved) {
          try {
            const config = JSON.parse(saved);
            setConfig(config);
            console.log('✅ Loaded OANDA config from localStorage (no user)');
            return;
          } catch (error) {
            console.error('Failed to parse saved OANDA config:', error);
          }
        }
        return;
      }

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
          environment: config.environment as 'practice' | 'live',
          enabled: config.enabled,
          configName: config.config_name
        };
        
        setConfig(oandaConfig);
        // Also save to localStorage for immediate access
        localStorage.setItem('oanda_config', JSON.stringify(oandaConfig));
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
    } finally {
      isLoadingConfigRef.current = false;
    }
  }, [setConfig]);

  const loadSavedConfigs = useCallback(async () => {
    if (isLoadingSavedConfigsRef.current) return;
    isLoadingSavedConfigsRef.current = true;

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
    } finally {
      isLoadingSavedConfigsRef.current = false;
    }
  }, [setSavedConfigs]);

  return {
    loadLastUsedConfig,
    loadSavedConfigs
  };
};
