
import { useOANDAConfig } from '@/hooks/oanda/useOANDAConfig';
import { useOANDAConnection } from '@/hooks/oanda/useOANDAConnection';
import { useOANDAStrategies } from '@/hooks/oanda/useOANDAStrategies';
import { useOANDATrade } from '@/hooks/oanda/useOANDATrade';
import { useState, useEffect } from 'react';
import { ForwardTestingService } from '@/services/forwardTestingService';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const useOANDAIntegration = () => {
  const [isForwardTestingActive, setIsForwardTestingActive] = useState(false);

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

  // Load saved strategies on mount
  useEffect(() => {
    loadSavedStrategies();
    loadSelectedStrategy();
  }, []);

  // Check forward testing status on mount and periodically
  useEffect(() => {
    const checkForwardTestingStatus = async () => {
      try {
        // Check both client-side and server-side status
        const clientSideActive = ForwardTestingService.getInstance().isActive();
        const activeSessions = await ServerForwardTestingService.getActiveSessions();
        const serverSideActive = activeSessions.length > 0;
        
        const isActive = clientSideActive || serverSideActive;
        setIsForwardTestingActive(isActive);
        
        console.log('Forward testing status check:', {
          clientSideActive,
          serverSideActive: activeSessions.length > 0,
          totalActiveSessions: activeSessions.length,
          finalStatus: isActive
        });
      } catch (error) {
        console.error('Failed to check forward testing status:', error);
      }
    };

    checkForwardTestingStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkForwardTestingStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Reset connection status when credentials change
  const handleConfigChangeWithReset = (field: keyof typeof config, value: any) => {
    handleConfigChange(field, value);
    if (field === 'accountId' || field === 'apiKey' || field === 'environment') {
      resetConnectionStatus();
    }
  };

  const handleToggleForwardTesting = async () => {
    const service = ForwardTestingService.getInstance();
    
    if (isForwardTestingActive) {
      service.stopForwardTesting();
      setIsForwardTestingActive(false);
    } else {
      if (canStartTesting && selectedStrategy) {
        await service.startForwardTesting({
          strategyId: selectedStrategy.id,
          oandaAccountId: config.accountId,
          oandaApiKey: config.apiKey,
          environment: config.environment,
          enabled: true
        }, selectedStrategy);
        setIsForwardTestingActive(true);
      }
    }
  };

  const handleShowGuide = () => {
    // This could navigate to a guide or open a modal
    console.log('Show OANDA setup guide');
  };

  const isConfigured = config.accountId && config.apiKey;
  const canStartTesting = isConfigured && connectionStatus === 'success' && selectedStrategy !== null;

  // Connection status icon
  const getConnectionStatusIcon = () => {
    if (connectionStatus === 'success') {
      return CheckCircle;
    } else if (connectionStatus === 'testing') {
      return Clock;
    } else {
      return XCircle;
    }
  };

  const connectionStatusIcon = getConnectionStatusIcon();

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
    handleConfigChange: handleConfigChangeWithReset,
    handleTestConnection: () => handleTestConnection(config),
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
    loadSavedStrategies
  };
};
