
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OANDAConfig {
  accountId: string;
  apiKey: string;
  environment: 'practice' | 'live';
}

interface AccountInfo {
  balance: number;
  currency: string;
  nav: number;
  unrealizedPL: number;
  marginUsed: number;
  marginAvailable: number;
  positionValue: number;
  openTradeCount: number;
  openPositionCount: number;
  alias: string;
}

interface ConnectionResult {
  success: boolean;
  accountInfo?: AccountInfo;
  error?: string;
  details?: any;
}

export const useConnectionTester = () => {
  const { toast } = useToast();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null);
  const [lastTestTime, setLastTestTime] = useState<string>('');

  const detectAccountEnvironment = (accountId: string): 'practice' | 'live' => {
    // Practice accounts typically start with 101-003 or have specific patterns
    if (accountId.startsWith('101-003') || accountId.includes('demo') || accountId.includes('practice')) {
      return 'practice';
    }
    // Live accounts typically start with 001 or other patterns
    return 'live';
  };

  const testOANDAConnection = async (config: OANDAConfig) => {
    if (!config.accountId || !config.apiKey) {
      toast({
        title: "Missing Configuration",
        description: "Please configure your OANDA account details first",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionResult(null);

    try {
      // Auto-detect correct environment based on account ID
      const detectedEnvironment = detectAccountEnvironment(config.accountId);
      const environmentToUse = detectedEnvironment;

      const baseUrl = environmentToUse === 'practice' 
        ? 'https://api-fxpractice.oanda.com'
        : 'https://api-fxtrade.oanda.com';

      console.log('🔍 Testing OANDA connection with detailed diagnostics...');
      console.log('Account ID:', config.accountId);
      console.log('Detected Environment:', detectedEnvironment);
      console.log('Configured Environment:', config.environment);
      console.log('Using Environment:', environmentToUse);
      console.log('Base URL:', baseUrl);

      // Warn if environments don't match
      if (config.environment !== detectedEnvironment) {
        console.warn(`⚠️ Environment mismatch: Account appears to be ${detectedEnvironment} but ${config.environment} was configured. Using ${detectedEnvironment}.`);
      }

      const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('Response Status:', response.status);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ OANDA Account Data:', data);
        
        const accountInfo: AccountInfo = {
          balance: parseFloat(data.account.balance),
          currency: data.account.currency,
          nav: parseFloat(data.account.NAV),
          unrealizedPL: parseFloat(data.account.unrealizedPL),
          marginUsed: parseFloat(data.account.marginUsed),
          marginAvailable: parseFloat(data.account.marginAvailable),
          positionValue: parseFloat(data.account.positionValue),
          openTradeCount: data.account.openTradeCount,
          openPositionCount: data.account.openPositionCount,
          alias: data.account.alias || 'N/A'
        };

        setConnectionResult({
          success: true,
          accountInfo,
          details: data
        });

        const environmentNote = config.environment !== detectedEnvironment 
          ? ` (auto-detected ${detectedEnvironment} environment)`
          : '';

        toast({
          title: "✅ Connection Successful!",
          description: `Connected to ${detectedEnvironment} account: ${accountInfo.alias} (Balance: ${accountInfo.balance} ${accountInfo.currency})${environmentNote}`,
        });

      } else {
        const errorData = await response.json();
        console.error('❌ OANDA API Error:', errorData);
        
        let errorMessage = errorData.errorMessage || `HTTP ${response.status}`;
        
        // Provide specific guidance for common errors
        if (response.status === 401) {
          errorMessage = `Authentication failed. Your account ${config.accountId} appears to be a ${detectedEnvironment} account. Ensure your API token is for the ${detectedEnvironment} environment.`;
        } else if (response.status === 403 && errorData.errorMessage?.includes('Insufficient authorization')) {
          errorMessage = `Account ${config.accountId} is a ${detectedEnvironment} account. Your API token may not have access to this account or you may be using the wrong environment token.`;
        }
        
        setConnectionResult({
          success: false,
          error: errorMessage,
          details: errorData
        });

        toast({
          title: "❌ Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }

      setLastTestTime(new Date().toLocaleString());

    } catch (error) {
      console.error('❌ Connection test failed:', error);
      
      setConnectionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      });

      toast({
        title: "❌ Connection Error",
        description: "Failed to connect to OANDA API. Check your internet connection and credentials.",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return {
    isTestingConnection,
    connectionResult,
    lastTestTime,
    testOANDAConnection
  };
};
