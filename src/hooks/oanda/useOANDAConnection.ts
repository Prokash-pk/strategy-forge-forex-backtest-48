
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

    // Enhanced API key validation
    if (!config.apiKey.includes('-') || config.apiKey.length < 50) {
      toast({
        title: "Invalid API Key Format",
        description: "OANDA API keys should be long tokens with dashes. Please verify your API token from OANDA.",
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
        
        // Enhanced error handling for authorization issues
        if (response.status === 401) {
          const errorMessage = "🔑 Your OANDA API token has expired or is invalid.\n\n" +
                              "Please generate a new token:\n" +
                              "1. Log into your OANDA account\n" +
                              "2. Go to 'Manage API Access'\n" +
                              "3. Generate a new Personal Access Token\n" +
                              "4. Copy the new token and update your configuration\n\n" +
                              "⚠️ Note: OANDA tokens can expire and need periodic renewal.";
          setConnectionError(errorMessage);
          toast({
            title: "🔑 API Token Expired/Invalid",
            description: "Your OANDA API token needs to be renewed. Please generate a new token from your OANDA account.",
            variant: "destructive",
          });
        } else {
          throw new Error(errorData.errorMessage || `HTTP ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('OANDA connection test failed:', error);
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      setConnectionError(errorMessage);
      
      // Provide more specific error guidance
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('Insufficient authorization') || errorMessage.includes('401')) {
        userFriendlyMessage = '🔑 API token is invalid, expired, or lacks permissions. Please generate a new token from your OANDA account settings.';
      } else if (errorMessage.includes('404')) {
        userFriendlyMessage = 'Account not found. Please verify your account ID is correct for the selected environment.';
      } else if (errorMessage.includes('fetch')) {
        userFriendlyMessage = 'Network error. Please check your internet connection and try again.';
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
