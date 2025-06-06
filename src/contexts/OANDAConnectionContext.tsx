
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OANDAConnectionState {
  isConnected: boolean;
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
  lastConnectedAt: string | null;
  connectionError: string | null;
  accountInfo: any | null;
}

interface OANDAConnectionContextType extends OANDAConnectionState {
  setConnectionState: (state: Partial<OANDAConnectionState>) => void;
  testConnection: (config: OANDAConfig) => Promise<void>;
  disconnectOANDA: () => void;
  autoReconnect: (config: OANDAConfig) => Promise<void>;
}

interface OANDAConfig {
  accountId: string;
  apiKey: string;
  environment: 'practice' | 'live';
}

const OANDAConnectionContext = createContext<OANDAConnectionContextType | undefined>(undefined);

const OANDA_CONNECTION_KEY = 'oanda_connection_state';
const CONNECTION_HEARTBEAT_INTERVAL = 60000; // 60 seconds

export const OANDAConnectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  
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
          accountInfo: parsed.accountInfo || null
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
      accountInfo: null
    };
  });

  const setConnectionState = (updates: Partial<OANDAConnectionState>) => {
    setConnectionStateInternal(prev => {
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

  const testOANDAConnection = async (config: OANDAConfig): Promise<any> => {
    if (!config.accountId || !config.apiKey) {
      throw new Error('Missing Account ID or API Key');
    }

    const baseUrl = config.environment === 'practice' 
      ? 'https://api-fxpractice.oanda.com'
      : 'https://api-fxtrade.oanda.com';

    console.log('🔍 Testing OANDA connection...', {
      baseUrl,
      accountId: config.accountId,
      environment: config.environment
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errorMessage || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ OANDA connection successful:', data);
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Connection timeout - please check your internet connection and try again');
      }
      
      throw error;
    }
  };

  const testConnection = async (config: OANDAConfig) => {
    setConnectionState({ 
      connectionStatus: 'testing', 
      connectionError: null 
    });

    try {
      const data = await testOANDAConnection(config);
      
      setConnectionState({
        isConnected: true,
        connectionStatus: 'success',
        lastConnectedAt: new Date().toISOString(),
        accountInfo: data.account,
        connectionError: null
      });

      toast({
        title: "✅ Connection Successful!",
        description: `Connected to ${config.environment} account: ${data.account?.alias || config.accountId}`,
      });

    } catch (error) {
      console.error('❌ OANDA connection failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      
      setConnectionState({
        isConnected: false,
        connectionStatus: 'error',
        connectionError: errorMessage,
        accountInfo: null
      });

      toast({
        title: "❌ Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const disconnectOANDA = () => {
    setConnectionState({
      isConnected: false,
      connectionStatus: 'idle',
      connectionError: null,
      accountInfo: null,
      lastConnectedAt: null
    });
    
    localStorage.removeItem(OANDA_CONNECTION_KEY);
    
    toast({
      title: "Disconnected",
      description: "OANDA connection has been reset",
    });
  };

  const autoReconnect = async (config: OANDAConfig) => {
    if (!config.accountId || !config.apiKey) {
      return;
    }

    console.log('🔄 Attempting auto-reconnect to OANDA...');
    
    try {
      await testOANDAConnection(config);
      
      setConnectionState({
        isConnected: true,
        connectionStatus: 'success',
        lastConnectedAt: new Date().toISOString(),
        connectionError: null
      });

      console.log('✅ Auto-reconnect successful');
      
    } catch (error) {
      console.log('⚠️ Auto-reconnect failed, manual connection required');
      setConnectionState({
        isConnected: false,
        connectionStatus: 'idle',
        connectionError: null
      });
    }
  };

  // Connection health check heartbeat
  useEffect(() => {
    if (!connectionState.isConnected) return;

    const interval = setInterval(async () => {
      const savedConfig = localStorage.getItem('oanda_config');
      if (!savedConfig) return;

      try {
        const config = JSON.parse(savedConfig);
        if (config.accountId && config.apiKey) {
          // Silent health check
          await testOANDAConnection(config);
          console.log('💓 OANDA connection heartbeat OK');
        }
      } catch (error) {
        console.warn('💔 OANDA connection heartbeat failed, marking as disconnected');
        setConnectionState({
          isConnected: false,
          connectionStatus: 'error',
          connectionError: 'Connection lost during heartbeat check'
        });
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
