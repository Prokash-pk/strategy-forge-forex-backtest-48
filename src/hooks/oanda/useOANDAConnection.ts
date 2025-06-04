
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

    // Validate API key format
    if (!config.apiKey.includes('-')) {
      toast({
        title: "Invalid API Key Format",
        description: "OANDA API keys should contain dashes (e.g., 12345678-abcd1234567890abcdef1234567890ab-12345678901234567890123456789012)",
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

      console.log('Testing OANDA connection with:', {
        baseUrl,
        accountId: config.accountId,
        environment: config.environment,
        apiKeyLength: config.apiKey.length,
        apiKeyFormat: config.apiKey.substring(0, 8) + '...'
      });

      const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('OANDA API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const data = await response.json();
        console.log('OANDA Account Data:', data);
        setConnectionStatus('success');
        toast({
          title: "Connection Successful! ✅",
          description: `Connected to ${config.environment} account: ${data.account?.alias || config.accountId}`,
        });
      } else {
        const errorData = await response.json();
        console.error('OANDA API Error Response:', errorData);
        throw new Error(errorData.errorMessage || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('OANDA connection test failed:', error);
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      setConnectionError(errorMessage);
      
      // Provide more specific error guidance
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('Insufficient authorization')) {
        userFriendlyMessage = 'API key is invalid or doesn\'t have access to this account. Please check your API token and account ID.';
      } else if (errorMessage.includes('401')) {
        userFriendlyMessage = 'Authentication failed. Please verify your API token is correct and active.';
      } else if (errorMessage.includes('404')) {
        userFriendlyMessage = 'Account not found. Please check your account ID is correct.';
      }
      
      toast({
        title: "Connection Failed ❌",
        description: userFriendlyMessage,
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
