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

  // Check server-side forward testing status on mount and periodically
  useEffect(() => {
    const checkForwardTestingStatus = async () => {
      try {
        // Check server-side status - this is the primary source of truth
        const activeSessions = await ServerForwardTestingService.getActiveSessions();
        const serverSideActive = activeSessions.length > 0;
        
        // Update state based on server-side status
        setIsForwardTestingActive(serverSideActive);
        
        console.log('📊 Forward testing status check:', {
          serverSideActive: activeSessions.length > 0,
          totalActiveSessions: activeSessions.length,
          finalStatus: serverSideActive
        });

        if (serverSideActive) {
          console.log('✅ Server-side forward testing is ACTIVE');
          console.log('🔄 Trading sessions are running independently on the server');
        } else {
          console.log('⏸️ No active server-side trading sessions found');
        }
      } catch (error) {
        console.error('Failed to check forward testing status:', error);
        setIsForwardTestingActive(false);
      }
    };

    checkForwardTestingStatus();
    
    // Check status every 30 seconds to stay in sync with server
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
      // Stop forward testing
      await service.stopForwardTesting();
      setIsForwardTestingActive(false);
      console.log('🛑 Forward testing stopped');
    } else {
      // Start forward testing
      if (canStartTesting && selectedStrategy) {
        try {
          await service.startForwardTesting({
            strategyId: selectedStrategy.id,
            oandaAccountId: config.accountId,
            oandaApiKey: config.apiKey,
            environment: config.environment,
            enabled: true
          }, selectedStrategy);
          
          setIsForwardTestingActive(true);
          console.log('🚀 Forward testing started - will continue running on server');
        } catch (error) {
          console.error('Failed to start forward testing:', error);
          // Keep the state as false if starting failed
        }
      }
    }
  };

  const handleShowGuide = () => {
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
