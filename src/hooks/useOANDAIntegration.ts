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
import { BrowserKeepalive } from '@/services/browserKeepalive';

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
    isLoadingStrategies,
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
    hasServerSession,
    startForwardTesting,
    stopForwardTesting,
    toggleForwardTesting,
    checkExistingServerSessions
  } = useOANDAForwardTesting(selectedStrategy, config);

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

  // Auto-manage browser keepalive based on forward testing status
  useEffect(() => {
    const browserKeepalive = BrowserKeepalive.getInstance();
    
    if (isForwardTestingActive && isConnected && selectedStrategy) {
      console.log('🚀 Starting browser keepalive for 24/7 trading...');
      browserKeepalive.startKeepalive();
    } else if (!isForwardTestingActive && browserKeepalive.getStatus().isActive) {
      console.log('⏸️ Stopping browser keepalive - forward testing inactive');
      browserKeepalive.stopKeepalive();
      document.title = 'Strategy Builder & Backtester';
    }
  }, [isForwardTestingActive, isConnected, selectedStrategy]);

  // Auto-reconnect when config changes and we have valid credentials
  useEffect(() => {
    if (config.accountId && config.apiKey && !isConnected && !isAutoReconnecting) {
      console.log('🔄 Config updated, attempting auto-reconnect...');
      autoReconnect(config);
    }
  }, [config.accountId, config.apiKey, config.environment]);

  // Auto-manage AutoStrategyTester based on forward testing status
  useEffect(() => {
    const autoTester = AutoStrategyTester.getInstance();
    
    if (isConnected && selectedStrategy && config.accountId && isForwardTestingActive) {
      console.log('🚀 Starting AutoStrategyTester...');
      autoTester.autoStart(config, selectedStrategy, isForwardTestingActive);
    } else if (autoTester.isActive() && !isForwardTestingActive) {
      console.log('⏸️ Stopping AutoStrategyTester - forward testing inactive');
      autoTester.stopAutoTesting();
    }
  }, [isConnected, selectedStrategy, isForwardTestingActive, config]);

  const handleConfigChangeWithAutoReconnect = useCallback((field: keyof typeof config, value: any) => {
    handleConfigChange(field, value);
  }, [handleConfigChange]);

  const handleShowGuide = useCallback(() => {
    console.log('Show OANDA setup guide');
  }, []);

  const handleToggleForwardTesting = useCallback(async () => {
    console.log('🔄 Toggling forward testing...');
    
    try {
      const result = await toggleForwardTesting();
      console.log('✅ Forward testing toggle result:', result);
      return result;
    } catch (error) {
      console.error('❌ Forward testing toggle error:', error);
      throw error;
    }
  }, [toggleForwardTesting]);

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
    isLoadingStrategies,
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
    loadSavedConfigs,
    loadSavedStrategies,
    autoReconnect: () => autoReconnect(config),
    forceRestartKeepalive: forceRestart
  };
};
