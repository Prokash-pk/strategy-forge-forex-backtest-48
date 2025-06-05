
import { useState, useEffect } from 'react';
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
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    
    // Immediately save to localStorage for persistence across tab changes
    localStorage.setItem('oanda_config', JSON.stringify(newConfig));
    console.log('💾 Saved OANDA config to localStorage:', field, value);
  };

  const setConfigWithPersistence = (newConfig: OANDAConfig) => {
    setConfig(newConfig);
    // Also save to localStorage
    localStorage.setItem('oanda_config', JSON.stringify(newConfig));
    console.log('💾 Set and persisted OANDA config');
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    localStorage.removeItem('oanda_config');
    console.log('🗑️ Reset OANDA config');
  };

  // Load config from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('oanda_config');
    if (saved) {
      try {
        const parsedConfig = JSON.parse(saved);
        setConfig(parsedConfig);
        console.log('🔄 Restored OANDA config from localStorage on mount');
      } catch (error) {
        console.error('Failed to parse saved OANDA config on mount:', error);
      }
    }
  }, []);

  return {
    config,
    setConfig: setConfigWithPersistence,
    savedConfigs,
    setSavedConfigs,
    isLoading,
    setIsLoading,
    handleConfigChange,
    resetConfig,
    defaultConfig
  };
};
