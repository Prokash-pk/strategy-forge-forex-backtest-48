
import { useToast } from '@/hooks/use-toast';
import { OANDAConnectionState, OANDAConfig, MAX_RETRY_ATTEMPTS, RETRY_DELAY, OANDA_CONNECTION_KEY } from './types';
import { testOANDAConnection } from './connectionUtils';

export function useOANDAConnectionOperations(
  connectionState: OANDAConnectionState,
  setConnectionState: (state: Partial<OANDAConnectionState>) => void
) {
  const { toast } = useToast();

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
        connectionError: null,
        retryCount: 0,
        isAutoReconnecting: false
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
        accountInfo: null,
        isAutoReconnecting: false
      });

      toast({
        title: "❌ Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // New manual connect function that users can trigger
  const manualConnect = async (config: OANDAConfig) => {
    console.log('🔄 Manual OANDA connection requested by user');
    
    // Stop any auto-reconnect in progress
    setConnectionState({ 
      isAutoReconnecting: false,
      retryCount: 0 
    });
    
    // Perform the connection test
    await testConnection(config);
  };

  const disconnectOANDA = () => {
    console.log('🔌 Manually disconnecting from OANDA');
    
    setConnectionState({
      isConnected: false,
      connectionStatus: 'idle',
      connectionError: null,
      accountInfo: null,
      lastConnectedAt: null,
      retryCount: 0,
      isAutoReconnecting: false
    });
    
    localStorage.removeItem(OANDA_CONNECTION_KEY);
    
    toast({
      title: "Disconnected",
      description: "OANDA connection has been reset",
    });
  };

  // Modified auto-reconnect with user control
  const autoReconnect = async (config: OANDAConfig, userRequested: boolean = false) => {
    if (!config.accountId || !config.apiKey) {
      return;
    }

    // Don't auto-reconnect if already connected or user manually disconnected
    if (connectionState.isConnected && !userRequested) {
      return;
    }

    // Don't auto-reconnect if already trying and it wasn't user requested
    if (connectionState.isAutoReconnecting && !userRequested) {
      return;
    }

    console.log(userRequested ? '🔄 User requested auto-reconnect...' : '🔄 Attempting auto-reconnect to OANDA...');
    
    setConnectionState({ 
      isAutoReconnecting: true,
      connectionStatus: 'testing'
    });

    // Only try once for auto-reconnect, not multiple attempts
    const maxAttempts = userRequested ? MAX_RETRY_ATTEMPTS : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 Auto-reconnect attempt ${attempt}/${maxAttempts}`);
        
        const data = await testOANDAConnection(config);
        
        setConnectionState({
          isConnected: true,
          connectionStatus: 'success',
          lastConnectedAt: new Date().toISOString(),
          accountInfo: data.account,
          connectionError: null,
          retryCount: 0,
          isAutoReconnecting: false
        });

        console.log(`✅ Auto-reconnect successful on attempt ${attempt}`);
        
        if (userRequested) {
          toast({
            title: "🔄 Reconnected",
            description: `Successfully reconnected to OANDA ${config.environment} account`,
          });
        }
        
        return;
        
      } catch (error) {
        console.log(`⚠️ Auto-reconnect attempt ${attempt} failed:`, error);
        
        setConnectionState({
          retryCount: attempt
        });

        // If this was the last attempt, set error state
        if (attempt === maxAttempts) {
          setConnectionState({
            isConnected: false,
            connectionStatus: 'error',
            connectionError: userRequested 
              ? 'Reconnection failed. Please check your credentials and try again.'
              : 'Auto-reconnect failed. Please manually reconnect.',
            retryCount: attempt,
            isAutoReconnecting: false
          });

          if (userRequested) {
            toast({
              title: "⚠️ Reconnection Failed",
              description: "Please check your credentials and try again",
              variant: "destructive",
            });
          }
        } else {
          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }
  };

  return {
    testConnection,
    manualConnect,
    disconnectOANDA,
    autoReconnect
  };
}
