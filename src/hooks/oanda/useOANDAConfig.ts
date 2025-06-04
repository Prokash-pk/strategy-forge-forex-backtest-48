
import { useEffect } from 'react';
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

  // Load configs to ensure they persist across tab navigation
  useEffect(() => {
    if (user) {
      console.log('Loading OANDA configs and last used config...');
      loadLastUsedConfig();
      loadSavedConfigs(); // Load configs to show in manager
    }
  }, [user, loadLastUsedConfig, loadSavedConfigs]);

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
