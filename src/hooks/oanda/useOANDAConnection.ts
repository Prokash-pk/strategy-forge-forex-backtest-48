
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OANDAConfig, ConnectionStatus } from '@/types/oanda';

export const useOANDAConnection = () => {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionError, setConnectionError] = useState<string>('');

  const detectAccountEnvironment = (accountId: string): 'practice' | 'live' => {
    // Practice accounts typically start with 101-003 or have specific patterns
    if (accountId.startsWith('101-003') || accountId.includes('demo') || accountId.includes('practice')) {
      return 'practice';
    }
    // Live accounts typically start with 001 or other patterns
    return 'live';
  };

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

    // Auto-detect correct environment based on account ID
    const detectedEnvironment = detectAccountEnvironment(config.accountId);
    const environmentToUse = detectedEnvironment;

    // Warn if user selected wrong environment
    if (config.environment !== detectedEnvironment) {
      console.warn(`Account ${config.accountId} appears to be a ${detectedEnvironment} account, but ${config.environment} environment was selected. Using ${detectedEnvironment} environment.`);
    }

    setConnectionStatus('testing');
    setConnectionError('');

    try {
      const baseUrl = environmentToUse === 'practice' 
        ? 'https://api-fxpractice.oanda.com'
        : 'https://api-fxtrade.oanda.com';

      console.log('Testing OANDA connection with:', {
        baseUrl,
        accountId: config.accountId,
        environment: environmentToUse,
        detectedEnvironment,
        configuredEnvironment: config.environment,
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
        
        const environmentMessage = config.environment !== detectedEnvironment 
          ? ` (auto-detected ${detectedEnvironment} environment)`
          : '';
        
        toast({
          title: "Connection Successful! ✅",
          description: `Connected to ${detectedEnvironment} account: ${data.account?.alias || config.accountId}${environmentMessage}`,
        });
      } else {
        const errorData = await response.json();
        console.error('OANDA API Error Response:', errorData);
        
        // Provide specific guidance for common errors
        let userFriendlyMessage = errorData.errorMessage || `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 401) {
          userFriendlyMessage = `Authentication failed. Your account ${config.accountId} appears to be a ${detectedEnvironment} account. Make sure you're using the correct API token for the ${detectedEnvironment} environment.`;
        } else if (response.status === 403 && errorData.errorMessage?.includes('Insufficient authorization')) {
          userFriendlyMessage = `Insufficient authorization. Account ${config.accountId} is a ${detectedEnvironment} account but you may be trying to access the wrong environment. Please verify your API token is for the ${detectedEnvironment} environment.`;
        } else if (response.status === 404) {
          userFriendlyMessage = `Account not found. Please verify account ID ${config.accountId} is correct for the ${detectedEnvironment} environment.`;
        }
        
        throw new Error(userFriendlyMessage);
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
