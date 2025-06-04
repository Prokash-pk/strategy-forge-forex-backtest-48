
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

  // Don't auto-load configs on mount - user should explicitly add accounts
  // This ensures only manually added accounts appear in the manager
  useEffect(() => {
    if (user) {
      // Only load the last used config, not all saved configs
      loadLastUsedConfig();
      // Removed loadSavedConfigs() - configs will only load when user adds them
    }
  }, [user]);

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
