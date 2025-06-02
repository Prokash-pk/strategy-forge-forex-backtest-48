
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Wifi } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OANDAConnectionTesterProps {
  config: {
    accountId: string;
    apiKey: string;
    environment: 'practice' | 'live';
  };
}

const OANDAConnectionTester: React.FC<OANDAConnectionTesterProps> = ({ config }) => {
  const { toast } = useToast();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [lastTestTime, setLastTestTime] = useState<string>('');

  const testOANDAConnection = async () => {
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
        
        const accountInfo = {
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
          rawData: data
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

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Wifi className="h-5 w-5" />
          OANDA Connection Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={testOANDAConnection}
            disabled={isTestingConnection || !config.accountId || !config.apiKey}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isTestingConnection ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Test Live Connection
              </>
            )}
          </Button>

          {lastTestTime && (
            <span className="text-sm text-slate-400">
              Last tested: {lastTestTime}
            </span>
          )}
        </div>

        {connectionResult && (
          <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              {connectionResult.success ? (
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
              <span className="font-medium text-white">
                {connectionResult.success ? 'Connection Successful' : 'Connection Failed'}
              </span>
            </div>

            {connectionResult.success && connectionResult.accountInfo && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Account:</span>
                  <span className="text-white ml-2">{connectionResult.accountInfo.alias}</span>
                </div>
                <div>
                  <span className="text-slate-400">Balance:</span>
                  <span className="text-emerald-400 ml-2 font-medium">
                    {connectionResult.accountInfo.balance} {connectionResult.accountInfo.currency}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">NAV:</span>
                  <span className="text-white ml-2">{connectionResult.accountInfo.nav} {connectionResult.accountInfo.currency}</span>
                </div>
                <div>
                  <span className="text-slate-400">Unrealized P&L:</span>
                  <span className={`ml-2 ${connectionResult.accountInfo.unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {connectionResult.accountInfo.unrealizedPL >= 0 ? '+' : ''}{connectionResult.accountInfo.unrealizedPL} {connectionResult.accountInfo.currency}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Open Positions:</span>
                  <span className="text-white ml-2">{connectionResult.accountInfo.openPositionCount}</span>
                </div>
                <div>
                  <span className="text-slate-400">Open Trades:</span>
                  <span className="text-white ml-2">{connectionResult.accountInfo.openTradeCount}</span>
                </div>
              </div>
            )}

            {!connectionResult.success && (
              <div className="text-red-400 text-sm">
                Error: {connectionResult.error}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-slate-500 mt-4">
          <p>💡 This test verifies your OANDA credentials and displays live account data.</p>
          <p>If the balance shows 0, check:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>You're using the correct environment (practice vs live)</li>
            <li>Your API key has the correct permissions</li>
            <li>Your account ID matches your OANDA account</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default OANDAConnectionTester;
