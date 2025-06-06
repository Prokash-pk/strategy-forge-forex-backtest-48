
import { useEffect, useCallback } from 'react';
import { useOANDAConfig } from '@/hooks/oanda/useOANDAConfig';
import { useOANDAConnection } from '@/hooks/oanda/useOANDAConnection';
import { useOANDAStrategies } from '@/hooks/oanda/useOANDAStrategies';
import { useOANDATrade } from '@/hooks/oanda/useOANDATrade';
import { useOANDAForwardTesting } from '@/hooks/oanda/useOANDAForwardTesting';
import { useOANDAKeepalive } from '@/hooks/oanda/useOANDAKeepalive';
import { useOANDAState } from '@/hooks/oanda/useOANDAState';
import { useOANDALogging } from '@/hooks/oanda/useOANDALogging';
import { AutoStrategyTester } from '@/services/autoTesting/autoStrategyTester';

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
    autoReconnect,
    retryCount,
    isAutoReconnecting
  } = useOANDAConnection();

  const {
    savedStrategies,
    selectedStrategy,
    loadSelectedStrategy,
    loadSavedStrategies,
    loadStrategyById,
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
    handleToggleForwardTesting: baseHandleToggleForwardTesting,
    autoStartForwardTesting
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

  // Initialize and restore state on mount
  useEffect(() => {
    console.log('useOANDAIntegration: Initializing...');
    loadSavedStrategies();
    loadSelectedStrategy();
  }, []);

  // Auto-reconnect when config changes and we have valid credentials
  useEffect(() => {
    if (config.accountId && config.apiKey && !isConnected && !isAutoReconnecting) {
      console.log('🔄 Config updated, attempting auto-reconnect...');
      autoReconnect(config);
    }
  }, [config.accountId, config.apiKey, config.environment]);

  // Auto-start forward testing when ready
  useEffect(() => {
    if (isConnected && selectedStrategy && canStartTesting && !isForwardTestingActive) {
      console.log('🎯 Conditions met for auto-start - checking preferences...');
      
      const timer = setTimeout(() => {
        autoStartForwardTesting(config, selectedStrategy, isConnected);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, selectedStrategy, canStartTesting, isForwardTestingActive]);

  // Auto-manage AutoStrategyTester based on forward testing status
  useEffect(() => {
    const autoTester = AutoStrategyTester.getInstance();
    
    if (isConnected && selectedStrategy && config.accountId) {
      autoTester.autoStart(config, selectedStrategy, isForwardTestingActive);
    } else if (autoTester.isActive()) {
      autoTester.stopAutoTesting();
    }
  }, [isConnected, selectedStrategy, isForwardTestingActive, config]);

  const handleConfigChangeWithAutoReconnect = useCallback((field: keyof typeof config, value: any) => {
    handleConfigChange(field, value);
  }, [handleConfigChange]);

  const handleShowGuide = useCallback(() => {
    console.log('Show OANDA setup guide');
  }, []);

  const handleToggleForwardTesting = useCallback(() => {
    return baseHandleToggleForwardTesting(config, selectedStrategy, canStartTesting);
  }, [baseHandleToggleForwardTesting, config, selectedStrategy, canStartTesting]);

  const handleEnhancedTestConnection = useCallback(async () => {
    await handleTestConnection(config);
  }, [handleTestConnection, config]);

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
    retryCount,
    isAutoReconnecting,
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
