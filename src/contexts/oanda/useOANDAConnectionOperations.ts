
import { useToast } from '@/hooks/use-toast';
import { OANDAConnectionState, OANDAConfig, MAX_RETRY_ATTEMPTS, RETRY_DELAY } from './types';
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

  const disconnectOANDA = () => {
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

  const autoReconnect = async (config: OANDAConfig) => {
    if (!config.accountId || !config.apiKey) {
      return;
    }

    // Don't attempt auto-reconnect if already connected or already trying
    if (connectionState.isConnected || connectionState.isAutoReconnecting) {
      return;
    }

    console.log('🔄 Attempting auto-reconnect to OANDA...');
    
    setConnectionState({ 
      isAutoReconnecting: true,
      connectionStatus: 'testing'
    });

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`🔄 Auto-reconnect attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`);
        
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
        
        toast({
          title: "🔄 Auto-Reconnected",
          description: `Successfully reconnected to OANDA ${config.environment} account`,
        });
        
        return;
        
      } catch (error) {
        console.log(`⚠️ Auto-reconnect attempt ${attempt} failed:`, error);
        
        setConnectionState({
          retryCount: attempt
        });

        // If this was the last attempt, set error state
        if (attempt === MAX_RETRY_ATTEMPTS) {
          setConnectionState({
            isConnected: false,
            connectionStatus: 'error',
            connectionError: 'Auto-reconnect failed after 3 attempts. Please manually reconnect.',
            retryCount: attempt,
            isAutoReconnecting: false
          });

          toast({
            title: "⚠️ Auto-Reconnect Failed",
            description: "Please manually reconnect to OANDA",
            variant: "destructive",
          });
        } else {
          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }
  };

  return {
    testConnection,
    disconnectOANDA,
    autoReconnect
  };
}
