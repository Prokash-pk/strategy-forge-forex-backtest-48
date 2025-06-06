
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

  // Persistent connection health check heartbeat that survives tab changes
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
          
          // Silent health check with shorter timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          try {
            await testOANDAConnection(config);
            clearTimeout(timeoutId);
            console.log('💓 OANDA connection heartbeat OK');
          } catch (error) {
            clearTimeout(timeoutId);
            console.warn('💔 OANDA connection heartbeat failed, attempting auto-reconnect...');
            
            // Only auto-reconnect if not already reconnecting
            if (!connectionState.isAutoReconnecting) {
              autoReconnect(config);
            }
          }
        }
      } catch (error) {
        console.warn('Heartbeat check failed:', error);
      }
    }, CONNECTION_HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [connectionState.isConnected, connectionState.isAutoReconnecting]);

  // Prevent connection drops on tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionState.isConnected) {
        console.log('👁️ Tab became visible, checking connection health...');
        
        // Quick connection check when tab becomes visible
        const savedConfig = localStorage.getItem('oanda_config');
        if (savedConfig) {
          try {
            const config = JSON.parse(savedConfig);
            if (config.accountId && config.apiKey && !connectionState.isAutoReconnecting) {
              // Delay check to avoid race conditions
              setTimeout(() => {
                testConnection(config);
              }, 1000);
            }
          } catch (error) {
            console.warn('Failed to reconnect on tab focus:', error);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connectionState.isConnected, connectionState.isAutoReconnecting]);

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
