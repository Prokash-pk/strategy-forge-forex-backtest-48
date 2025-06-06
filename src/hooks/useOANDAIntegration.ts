import { useEffect } from 'react';
import { useOANDAConfig } from '@/hooks/oanda/useOANDAConfig';
import { useOANDAConnection } from '@/hooks/oanda/useOANDAConnection';
import { useOANDAStrategies } from '@/hooks/oanda/useOANDAStrategies';
import { useOANDATrade } from '@/hooks/oanda/useOANDATrade';
import { useOANDAForwardTesting } from '@/hooks/oanda/useOANDAForwardTesting';
import { useOANDAKeepalive } from '@/hooks/oanda/useOANDAKeepalive';
import { useOANDAState } from '@/hooks/oanda/useOANDAState';
import { useOANDALogging } from '@/hooks/oanda/useOANDALogging';

export const useOANDAIntegration = () => {
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
    isConnected,
    lastConnectedAt,
    accountInfo,
    handleTestConnection,
    resetConnectionStatus,
    autoReconnect
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
    isForwardTestingActive,
    setIsForwardTestingActive,
    handleToggleForwardTesting: baseHandleToggleForwardTesting
  } = useOANDAForwardTesting();

  const { 
    keepaliveService, 
    isKeepaliveActive, 
    getKeepaliveStatus, 
    forceRestart 
  } = useOANDAKeepalive(config, connectionStatus);

  const {
    isConfigured,
    canStartTesting,
    connectionStatusIcon
  } = useOANDAState(config, selectedStrategy, connectionStatus);

  // Auto-reconnect on mount if configuration exists
  useEffect(() => {
    console.log('useOANDAIntegration: Initializing...');
    loadSavedStrategies();
    loadSelectedStrategy();
    
    // Auto-reconnect will be handled by the OANDAConnectionContext
    // No need to trigger it here as it's now done in the context provider
  }, []);

  // Auto-reconnect when config changes and we have valid credentials
  useEffect(() => {
    if (config.accountId && config.apiKey && !isConnected) {
      console.log('🔄 Config updated, attempting auto-reconnect...');
      autoReconnect(config);
    }
  }, [config.accountId, config.apiKey, config.environment]);

  const handleConfigChangeWithAutoReconnect = (field: keyof typeof config, value: any) => {
    handleConfigChange(field, value);
    // Auto-reconnect will be triggered by the useEffect above
  };

  const handleShowGuide = () => {
    console.log('Show OANDA setup guide');
  };

  const handleToggleForwardTesting = () => {
    return baseHandleToggleForwardTesting(config, selectedStrategy, canStartTesting);
  };

  // Enhanced connection test that maintains persistent state
  const handleEnhancedTestConnection = async () => {
    await handleTestConnection(config);
  };

  // Use logging hook
  useOANDALogging(
    savedStrategies,
    selectedStrategy,
    config,
    connectionStatus,
    canStartTesting,
    isTestingTrade,
    isForwardTestingActive
  );

  return {
    config,
    savedConfigs,
    connectionStatus,
    connectionError,
    isConnected,
    lastConnectedAt,
    accountInfo,
    savedStrategies,
    selectedStrategy,
    isLoading,
    isTestingTrade,
    isConfigured,
    canStartTesting,
    isForwardTestingActive,
    connectionStatusIcon,
    handleConfigChange: handleConfigChangeWithAutoReconnect,
    handleTestConnection: handleEnhancedTestConnection,
    handleSaveConfig,
    handleSaveNewConfig,
    handleLoadConfig,
    handleDeleteConfig,
    handleLoadStrategy,
    handleTestTrade: () => handleTestTrade(config, selectedStrategy, connectionStatus),
    handleDeleteStrategy,
    handleToggleForwardTesting,
    handleShowGuide,
    loadSelectedStrategy,
    loadSavedConfigs,
    loadSavedStrategies,
    autoReconnect: () => autoReconnect(config),
    forceRestartKeepalive: forceRestart
  };
};
