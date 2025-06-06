
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
    disconnectOANDA,
    autoReconnect
  } = useGlobalOANDAConnection();

  const handleTestConnection = async (config: OANDAConfig) => {
    await testConnection(config);
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
    resetConnectionStatus,
    disconnectOANDA,
    autoReconnect
  };
};
