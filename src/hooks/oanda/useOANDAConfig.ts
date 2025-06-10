
import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOANDAConfigState } from './config/useOANDAConfigState';
import { useOANDAConfigLoader } from './config/useOANDAConfigLoader';
import { useOANDAConfigSaver } from './config/useOANDAConfigSaver';
import { useOANDAConfigManager } from './config/useOANDAConfigManager';

export const useOANDAConfig = () => {
  const { user } = useAuth();
  
  const {
    config,
    setConfig,
    savedConfigs,
    setSavedConfigs,
    isLoading,
    setIsLoading,
    handleConfigChange,
    resetConfig
  } = useOANDAConfigState();

  const {
    loadLastUsedConfig,
    loadSavedConfigs
  } = useOANDAConfigLoader(setConfig, setSavedConfigs);

  const {
    handleSaveConfig,
    handleSaveNewConfig
  } = useOANDAConfigSaver(config, setIsLoading, loadSavedConfigs);

  const {
    handleLoadConfig,
    handleDeleteConfig
  } = useOANDAConfigManager(setConfig, resetConfig, savedConfigs, loadSavedConfigs);

  // Use ref to track if initial load has been completed
  const hasInitializedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  // Only load configs once when user changes or on initial mount
  useEffect(() => {
    const userId = user?.id || null;
    
    // Skip if already initialized for this user
    if (hasInitializedRef.current && currentUserIdRef.current === userId) {
      return;
    }

    console.log('🔄 User detected, loading OANDA configs and settings');
    
    if (user) {
      console.log('👤 Loading configs for authenticated user');
      loadSavedConfigs();
      loadLastUsedConfig();
    } else {
      console.log('🔄 No user, attempting to load from localStorage');
      loadLastUsedConfig(); // This will try localStorage if no user
    }

    hasInitializedRef.current = true;
    currentUserIdRef.current = userId;
  }, [user?.id]); // Only depend on user ID, not the functions

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
