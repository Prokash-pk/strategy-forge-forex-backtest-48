
import { useState } from 'react';
import { OANDAConfig, SavedOANDAConfig } from '@/types/oanda';

const defaultConfig: OANDAConfig = {
  accountId: '',
  apiKey: '',
  environment: 'practice',
  enabled: false
};

export const useOANDAConfigState = () => {
  const [config, setConfig] = useState<OANDAConfig>(defaultConfig);
  const [savedConfigs, setSavedConfigs] = useState<SavedOANDAConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfigChange = (field: keyof OANDAConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
  };

  return {
    config,
    setConfig,
    savedConfigs,
    setSavedConfigs,
    isLoading,
    setIsLoading,
    handleConfigChange,
    resetConfig,
    defaultConfig
  };
};
