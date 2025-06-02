
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

  // Auto-load saved config on mount
  useEffect(() => {
    if (user) {
      loadSavedConfigs();
      loadLastUsedConfig();
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
