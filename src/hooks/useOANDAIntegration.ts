
import { useOANDAConfig } from '@/hooks/oanda/useOANDAConfig';
import { useOANDAConnection } from '@/hooks/oanda/useOANDAConnection';
import { useOANDAStrategies } from '@/hooks/oanda/useOANDAStrategies';
import { useOANDATrade } from '@/hooks/oanda/useOANDATrade';

export const useOANDAIntegration = () => {
  const {
    config,
    savedConfigs,
    isLoading,
    handleConfigChange,
    handleSaveConfig,
    handleLoadConfig,
    loadSavedConfigs
  } = useOANDAConfig();

  const {
    connectionStatus,
    connectionError,
    handleTestConnection,
    resetConnectionStatus
  } = useOANDAConnection();

  const {
    savedStrategies,
    selectedStrategy,
    loadSelectedStrategy,
    loadSavedStrategies,
    handleLoadStrategy,
    handleDeleteStrategy
  } = useOANDAStrategies();

  const {
    isTestingTrade,
    handleTestTrade
  } = useOANDATrade();

  // Reset connection status when credentials change
  const handleConfigChangeWithReset = (field: keyof typeof config, value: any) => {
    handleConfigChange(field, value);
    if (field === 'accountId' || field === 'apiKey' || field === 'environment') {
      resetConnectionStatus();
    }
  };

  const isConfigured = config.accountId && config.apiKey;
  const canStartTesting = isConfigured && connectionStatus === 'success' && selectedStrategy !== null;

  return {
    config,
    connectionStatus,
    connectionError,
    savedConfigs,
    savedStrategies,
    selectedStrategy,
    isLoading,
    isTestingTrade,
    isConfigured,
    canStartTesting,
    handleConfigChange: handleConfigChangeWithReset,
    handleTestConnection: () => handleTestConnection(config),
    handleSaveConfig,
    handleLoadConfig,
    handleLoadStrategy,
    handleTestTrade: () => handleTestTrade(config, selectedStrategy, connectionStatus),
    handleDeleteStrategy,
    loadSelectedStrategy,
    loadSavedConfigs,
    loadSavedStrategies
  };
};
