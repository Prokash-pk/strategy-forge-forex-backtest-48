
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OANDAConfig, ConnectionStatus } from '@/types/oanda';

export const useOANDAConnection = () => {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionError, setConnectionError] = useState<string>('');

  const handleTestConnection = async (config: OANDAConfig) => {
    if (!config.accountId || !config.apiKey) {
      toast({
        title: "Missing Configuration",
        description: "Please enter both Account ID and API Key",
        variant: "destructive",
      });
      return;
    }

    setConnectionStatus('testing');
    setConnectionError('');

    try {
      const baseUrl = config.environment === 'practice' 
        ? 'https://api-fxpractice.oanda.com'
        : 'https://api-fxtrade.oanda.com';

      const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('success');
        toast({
          title: "Connection Successful! ✅",
          description: `Connected to ${config.environment} account: ${data.account?.alias || config.accountId}`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.errorMessage || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('OANDA connection test failed:', error);
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      setConnectionError(errorMessage);
      
      toast({
        title: "Connection Failed ❌",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const resetConnectionStatus = () => {
    setConnectionStatus('idle');
    setConnectionError('');
  };

  return {
    connectionStatus,
    connectionError,
    handleTestConnection,
    resetConnectionStatus
  };
};
