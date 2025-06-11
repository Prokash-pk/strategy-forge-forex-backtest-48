
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { OANDAConnectionContextType, OANDAConfig, CONNECTION_HEARTBEAT_INTERVAL } from './types';
import { useOANDAConnectionState } from './useOANDAConnectionState';
import { useOANDAConnectionOperations } from './useOANDAConnectionOperations';

const OANDAConnectionContext = createContext<OANDAConnectionContextType | undefined>(undefined);

export const OANDAConnectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { connectionState, setConnectionState } = useOANDAConnectionState();
  const { testConnection, manualConnect, disconnectOANDA, autoReconnect } = useOANDAConnectionOperations(
    connectionState,
    setConnectionState
  );

  // Auto-reconnect on mount only if we were previously connected (less aggressive)
  useEffect(() => {
    const savedConfig = localStorage.getItem('oanda_config');
    if (!savedConfig) return;

    try {
      const config = JSON.parse(savedConfig);
      if (config.accountId && config.apiKey && connectionState.lastConnectedAt) {
        console.log('🔄 Auto-reconnecting on app load (one-time)...');
        autoReconnect(config, false); // false = not user requested
      }
    } catch (error) {
      console.warn('Failed to parse saved config for auto-reconnect:', error);
    }
  }, []); // Only run once on mount

  // Modified heartbeat - more resilient to API key issues
  useEffect(() => {
    if (!connectionState.isConnected || connectionState.connectionStatus === 'error') return;

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
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
          
          try {
            await testOANDAConnection(config);
            clearTimeout(timeoutId);
            console.log('💓 OANDA connection heartbeat OK');
            
            // Reset any error state if heartbeat succeeds
            if (connectionState.connectionStatus === 'error') {
              setConnectionState({
                connectionStatus: 'success',
                connectionError: null
              });
            }
          } catch (error) {
            clearTimeout(timeoutId);
            console.warn('💔 OANDA connection heartbeat failed:', error);
            
            // Check if it's an API key error specifically
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const isAuthError = errorMessage.includes('401') || 
                               errorMessage.includes('Invalid API key') || 
                               errorMessage.includes('Unauthorized');
            
            if (isAuthError) {
              // For API key errors, set error status but DON'T disconnect
              console.log('🔑 API key error detected - keeping connection state, user needs to update credentials');
              setConnectionState({
                connectionStatus: 'error',
                connectionError: 'API key invalid or expired. Please update your credentials and test connection.'
              });
              // DO NOT set isConnected: false for API key errors
            } else {
              // For other errors, handle normally
              setConnectionState({
                isConnected: false,
                connectionStatus: 'error',
                connectionError: 'Connection lost. Please manually reconnect.'
              });
            }
          }
        }
      } catch (error) {
        console.warn('Heartbeat check failed:', error);
      }
    }, CONNECTION_HEARTBEAT_INTERVAL * 3); // Even less frequent heartbeat (3x instead of 2x)

    return () => clearInterval(interval);
  }, [connectionState.isConnected, connectionState.connectionStatus]);

  // Simple tab visibility check without auto-reconnect
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionState.isConnected) {
        console.log('👁️ Tab became visible - connection status preserved');
        // Don't automatically reconnect, just log
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connectionState.isConnected]);

  const contextValue: OANDAConnectionContextType = {
    ...connectionState,
    setConnectionState,
    testConnection,
    manualConnect,
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
