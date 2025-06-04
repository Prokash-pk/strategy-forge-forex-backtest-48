
import { useCallback } from 'react';

export const useOANDAConfigHandlers = (
  config: any,
  connectionStatus: string,
  handleConfigChange: any,
  resetConnectionStatus: any,
  handleTestConnection: any,
  handleSaveNewConfig: any,
  setPersistentConnectionStatus: any
) => {
  // Memoized config change handler
  const handleConfigChangeWithReset = useCallback((field: keyof typeof config, value: any) => {
    handleConfigChange(field, value);
    if (field === 'accountId' || field === 'apiKey' || field === 'environment') {
      resetConnectionStatus();
    }
  }, [handleConfigChange, resetConnectionStatus]);

  // Memoized config save handler
  const handlePersistentSaveConfig = useCallback(async () => {
    try {
      await handleTestConnection(config);
      
      if (connectionStatus === 'success') {
        const configToSave = {
          ...config,
          enabled: true,
          configName: config.configName || `OANDA Config ${new Date().toLocaleDateString()}`
        };

        await handleSaveNewConfig(configToSave);
        setPersistentConnectionStatus('connected');
        console.log('🔐 OANDA connection saved persistently');
      } else {
        throw new Error('Connection test failed - cannot save invalid credentials');
      }
    } catch (error) {
      console.error('Failed to save persistent OANDA connection:', error);
      setPersistentConnectionStatus('error');
    }
  }, [config, connectionStatus, handleTestConnection, handleSaveNewConfig, setPersistentConnectionStatus]);

  const handleShowGuide = useCallback(() => {
    console.log('Show OANDA setup guide');
  }, []);

  return {
    handleConfigChangeWithReset,
    handlePersistentSaveConfig,
    handleShowGuide
  };
};
