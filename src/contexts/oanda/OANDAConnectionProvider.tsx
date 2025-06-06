
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { OANDAConnectionContextType, OANDAConfig, CONNECTION_HEARTBEAT_INTERVAL } from './types';
import { useOANDAConnectionState } from './useOANDAConnectionState';
import { useOANDAConnectionOperations } from './useOANDAConnectionOperations';

const OANDAConnectionContext = createContext<OANDAConnectionContextType | undefined>(undefined);

export const OANDAConnectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { connectionState, setConnectionState } = useOANDAConnectionState();
  const { testConnection, disconnectOANDA, autoReconnect } = useOANDAConnectionOperations(
    connectionState,
    setConnectionState
  );

  // Auto-reconnect on mount if configuration exists and we were previously connected
  useEffect(() => {
    const savedConfig = localStorage.getItem('oanda_config');
    if (!savedConfig) return;

    try {
      const config = JSON.parse(savedConfig);
      if (config.accountId && config.apiKey && connectionState.lastConnectedAt) {
        console.log('🔄 Auto-reconnecting on app load...');
        autoReconnect(config);
      }
    } catch (error) {
      console.warn('Failed to parse saved config for auto-reconnect:', error);
    }
  }, []); // Only run once on mount

  // Connection health check heartbeat
  useEffect(() => {
    if (!connectionState.isConnected) return;

    const interval = setInterval(async () => {
      const savedConfig = localStorage.getItem('oanda_config');
      if (!savedConfig) return;

      try {
        const config = JSON.parse(savedConfig);
        if (config.accountId && config.apiKey) {
          // Import here to avoid circular dependency
          const { testOANDAConnection } = await import('./connectionUtils');
          
          // Silent health check
          await testOANDAConnection(config);
          console.log('💓 OANDA connection heartbeat OK');
        }
      } catch (error) {
        console.warn('💔 OANDA connection heartbeat failed, attempting auto-reconnect...');
        
        // Try to auto-reconnect on heartbeat failure
        const config = JSON.parse(savedConfig);
        autoReconnect(config);
      }
    }, CONNECTION_HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [connectionState.isConnected]);

  const contextValue: OANDAConnectionContextType = {
    ...connectionState,
    setConnectionState,
    testConnection,
    disconnectOANDA,
    autoReconnect
  };

  return (
    <OANDAConnectionContext.Provider value={contextValue}>
      {children}
    </OANDAConnectionContext.Provider>
  );
};

export const useOANDAConnection = () => {
  const context = useContext(OANDAConnectionContext);
  if (context === undefined) {
    throw new Error('useOANDAConnection must be used within an OANDAConnectionProvider');
  }
  return context;
};
