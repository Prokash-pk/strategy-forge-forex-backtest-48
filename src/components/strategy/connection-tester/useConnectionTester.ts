
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
      const baseUrl = config.environment === 'practice' 
        ? 'https://api-fxpractice.oanda.com'
        : 'https://api-fxtrade.oanda.com';

      console.log('🔍 Testing OANDA connection with detailed diagnostics...');
      console.log('Environment:', config.environment);
      console.log('Base URL:', baseUrl);
      console.log('Account ID:', config.accountId);

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

        toast({
          title: "✅ Connection Successful!",
          description: `Connected to ${config.environment} account: ${accountInfo.alias} (Balance: ${accountInfo.balance} ${accountInfo.currency})`,
        });

      } else {
        const errorData = await response.json();
        console.error('❌ OANDA API Error:', errorData);
        
        setConnectionResult({
          success: false,
          error: errorData.errorMessage || `HTTP ${response.status}`,
          details: errorData
        });

        toast({
          title: "❌ Connection Failed",
          description: errorData.errorMessage || `HTTP ${response.status}: ${response.statusText}`,
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
