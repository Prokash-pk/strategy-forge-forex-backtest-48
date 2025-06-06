
import { useState } from 'react';
import { OANDAConnectionState, OANDA_CONNECTION_KEY } from './types';

export function useOANDAConnectionState() {
  const [connectionState, setConnectionStateInternal] = useState<OANDAConnectionState>(() => {
    // Load persisted connection state on initialization
    const saved = localStorage.getItem(OANDA_CONNECTION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          isConnected: false, // Always start as disconnected, will auto-reconnect if valid
          connectionStatus: 'idle',
          lastConnectedAt: parsed.lastConnectedAt || null,
          connectionError: null,
          accountInfo: parsed.accountInfo || null,
          retryCount: 0,
          isAutoReconnecting: false
        };
      } catch (error) {
        console.error('Failed to parse saved connection state:', error);
      }
    }
    
    return {
      isConnected: false,
      connectionStatus: 'idle',
      lastConnectedAt: null,
      connectionError: null,
      accountInfo: null,
      retryCount: 0,
      isAutoReconnecting: false
    };
  });

  const setConnectionState = (updates: Partial<OANDAConnectionState>) => {
    // Make sure we're working with the proper update type
    if (typeof updates !== 'object' || updates === null) {
      console.error('Invalid updates passed to setConnectionState:', updates);
      return;
    }
    
    // Use a simple object spread to update the state
    setConnectionStateInternal((prev) => {
      const newState = { ...prev, ...updates };
      
      // Persist to localStorage
      localStorage.setItem(OANDA_CONNECTION_KEY, JSON.stringify({
        lastConnectedAt: newState.lastConnectedAt,
        accountInfo: newState.accountInfo,
        isConnected: newState.isConnected
      }));
      
      return newState;
    });
  };

  return {
    connectionState,
    setConnectionState
  };
}
