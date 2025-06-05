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

  // Load saved strategies on mount and log the process
  useEffect(() => {
    console.log('useOANDAIntegration: Loading strategies on mount');
    loadSavedStrategies();
    loadSelectedStrategy();
  }, []);

  // Reset connection status when credentials change, but don't stop keepalive
  const handleConfigChangeWithReset = (field: keyof typeof config, value: any) => {
    handleConfigChange(field, value);
    if (field === 'accountId' || field === 'apiKey' || field === 'environment') {
      resetConnectionStatus();
      // Note: keepalive will automatically restart with new config via useOANDAKeepalive
    }
  };

  const handleShowGuide = () => {
    console.log('Show OANDA setup guide');
  };

  // Wrapper function that provides the required parameters
  const handleToggleForwardTesting = () => {
    return baseHandleToggleForwardTesting(config, selectedStrategy, canStartTesting);
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

  // Enhanced connection test that maintains keepalive
  const handleEnhancedTestConnection = async () => {
    await handleTestConnection(config);
    // Keepalive will automatically boost after successful connection
  };

  return {
    config,
    savedConfigs,
    connectionStatus,
    connectionError,
    savedStrategies,
    selectedStrategy,
    isLoading,
    isTestingTrade,
    isConfigured,
    canStartTesting,
    isForwardTestingActive,
    connectionStatusIcon,
    // Enhanced keepalive info
    isKeepaliveActive,
    keepaliveStatus: getKeepaliveStatus(),
    handleConfigChange: handleConfigChangeWithReset,
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
    // New keepalive control methods
    forceRestartKeepalive: forceRestart
  };
};
