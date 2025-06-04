
import { useEffect } from 'react';
import { useOANDAConfig } from '@/hooks/oanda/useOANDAConfig';
import { useOANDAConnection } from '@/hooks/oanda/useOANDAConnection';
import { useOANDAStrategies } from '@/hooks/oanda/useOANDAStrategies';
import { useOANDATrade } from '@/hooks/oanda/useOANDATrade';
import { useAuth } from '@/hooks/useAuth';
import { useOANDAPersistentConnection } from '@/hooks/oanda/integration/useOANDAPersistentConnection';
import { useOANDAForwardTesting } from '@/hooks/oanda/integration/useOANDAForwardTesting';
import { useOANDAConfigHandlers } from '@/hooks/oanda/integration/useOANDAConfigHandlers';
import { useOANDAComputedValues } from '@/hooks/oanda/integration/useOANDAComputedValues';

export const useOANDAIntegration = () => {
  const { user } = useAuth();

  const {
    config,
    savedConfigs,
    isLoading,
    handleConfigChange,
    handleSaveConfig,
    handleSaveNewConfig: handleSaveNewConfigBase,
    handleLoadConfig,
    handleDeleteConfig: handleDeleteConfigBase,
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

  const {
    persistentConnectionStatus,
    setPersistentConnectionStatus,
    handleDisconnectOANDA
  } = useOANDAPersistentConnection(handleLoadConfig);

  const {
    isForwardTestingActive,
    handleToggleForwardTesting: handleToggleForwardTestingBase
  } = useOANDAForwardTesting();

  const {
    isConfigured,
    canStartTesting,
    connectionStatusIcon
  } = useOANDAComputedValues(persistentConnectionStatus, connectionStatus, config, selectedStrategy);

  const {
    handleConfigChangeWithReset,
    handlePersistentSaveConfig,
    handleShowGuide
  } = useOANDAConfigHandlers(
    config,
    connectionStatus,
    handleConfigChange,
    resetConnectionStatus,
    handleTestConnection,
    handleSaveNewConfigBase,
    setPersistentConnectionStatus
  );

  // Load strategies only once on mount
  useEffect(() => {
    if (!user) return;
    
    console.log('Loading OANDA strategies...');
    loadSavedStrategies();
    loadSelectedStrategy();
  }, [user, loadSavedStrategies, loadSelectedStrategy]);

  const handleToggleForwardTesting = () => {
    handleToggleForwardTestingBase(canStartTesting, selectedStrategy, config);
  };

  // Create async wrapper functions to match expected Promise<void> signatures
  const handleDeleteConfigWrapper = async (configId: string): Promise<void> => {
    await handleDeleteConfigBase(configId);
  };

  const handleSaveNewConfigWrapper = async (config: any): Promise<void> => {
    await handleSaveNewConfigBase(config);
  };

  return {
    config,
    savedConfigs,
    connectionStatus: persistentConnectionStatus === 'connected' ? 'success' : connectionStatus,
    connectionError,
    savedStrategies,
    selectedStrategy,
    isLoading,
    isTestingTrade,
    isConfigured,
    canStartTesting,
    isForwardTestingActive,
    connectionStatusIcon,
    persistentConnectionStatus,
    handleConfigChange: handleConfigChangeWithReset,
    handleTestConnection: () => handleTestConnection(config),
    handleSaveConfig: handlePersistentSaveConfig,
    handleSaveNewConfig: handleSaveNewConfigWrapper,
    handleLoadConfig,
    handleDeleteConfig: handleDeleteConfigWrapper,
    handleLoadStrategy,
    handleTestTrade: () => handleTestTrade(config, selectedStrategy, connectionStatus),
    handleDeleteStrategy,
    handleToggleForwardTesting,
    handleShowGuide,
    handleDisconnectOANDA,
    loadSelectedStrategy,
    loadSavedConfigs,
    loadSavedStrategies
  };
};
