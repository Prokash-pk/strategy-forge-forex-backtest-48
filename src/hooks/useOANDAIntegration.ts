
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
    handleSaveNewConfig,
    handleLoadConfig,
    handleDeleteConfig,
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
    handleSaveNewConfig,
    setPersistentConnectionStatus
  );

  // Load both strategies and configs when component mounts
  useEffect(() => {
    if (!user) return;
    
    console.log('Loading OANDA data...');
    loadSavedStrategies();
    loadSelectedStrategy();
    loadSavedConfigs(); // Ensure configs are loaded on mount
  }, [user, loadSavedStrategies, loadSelectedStrategy, loadSavedConfigs]);

  const handleToggleForwardTesting = () => {
    handleToggleForwardTestingBase(canStartTesting, selectedStrategy, config);
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
    handleSaveNewConfig,
    handleLoadConfig,
    handleDeleteConfig,
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
