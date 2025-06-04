
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useOANDAPersistentConnection = (handleLoadConfig: any) => {
  const [persistentConnectionStatus, setPersistentConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const { user } = useAuth();
  const hasLoadedPersistentConnection = useRef(false);

  // Load persistent connection only once per user session
  useEffect(() => {
    if (!user || hasLoadedPersistentConnection.current) return;

    const loadPersistentConnection = async () => {
      try {
        const { data: configs, error } = await supabase
          .from('oanda_configs')
          .select('*')
          .eq('user_id', user.id)
          .eq('enabled', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && configs && configs.length > 0) {
          const savedConfig = configs[0];
          
          const mappedConfig = {
            id: savedConfig.id,
            accountId: savedConfig.account_id,
            apiKey: savedConfig.api_key,
            environment: savedConfig.environment as 'practice' | 'live',
            enabled: savedConfig.enabled,
            configName: savedConfig.config_name,
            createdAt: savedConfig.created_at
          };
          
          handleLoadConfig(mappedConfig);
          setPersistentConnectionStatus('connected');
          console.log('✅ OANDA credentials restored from persistent storage');
        } else {
          setPersistentConnectionStatus('idle');
        }
        
        hasLoadedPersistentConnection.current = true;
      } catch (error) {
        console.error('Failed to load persistent OANDA connection:', error);
        setPersistentConnectionStatus('error');
        hasLoadedPersistentConnection.current = true;
      }
    };

    loadPersistentConnection();
  }, [user, handleLoadConfig]);

  const handleDisconnectOANDA = useCallback(async () => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('oanda_configs')
        .update({ enabled: false })
        .eq('user_id', user.id);

      if (error) throw error;

      setPersistentConnectionStatus('idle');
      hasLoadedPersistentConnection.current = false;
      
      console.log('🔌 OANDA connection disconnected');
    } catch (error) {
      console.error('Failed to disconnect OANDA:', error);
    }
  }, [user]);

  return {
    persistentConnectionStatus,
    setPersistentConnectionStatus,
    handleDisconnectOANDA
  };
};
