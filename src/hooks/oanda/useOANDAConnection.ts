
import { useOANDAConnection as useGlobalOANDAConnection } from '@/contexts/OANDAConnectionContext';
import { OANDAConfig } from '@/types/oanda';

export const useOANDAConnection = () => {
  const {
    connectionStatus,
    connectionError,
    isConnected,
    lastConnectedAt,
    accountInfo,
    testConnection,
    manualConnect,
    disconnectOANDA,
    autoReconnect,
    retryCount,
    isAutoReconnecting
  } = useGlobalOANDAConnection();

  const handleTestConnection = async (config: OANDAConfig) => {
    await testConnection(config);
  };

  const handleManualConnect = async (config: OANDAConfig) => {
    await manualConnect(config);
  };

  const resetConnectionStatus = () => {
    // This is now handled by the global context
    // Connection status persists across components
  };

  return {
    connectionStatus,
    connectionError,
    isConnected,
    lastConnectedAt,
    accountInfo,
    handleTestConnection,
    handleManualConnect,
    resetConnectionStatus,
    disconnectOANDA,
    autoReconnect,
    retryCount,
    isAutoReconnecting
  };
};
