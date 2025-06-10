
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Wifi, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { testOANDAConnection } from '@/contexts/oanda/connectionUtils';

interface OANDAConnectionTesterProps {
  config: {
    accountId: string;
    apiKey: string;
    environment: 'practice' | 'live';
  };
}

const OANDAConnectionTester: React.FC<OANDAConnectionTesterProps> = ({ config }) => {
  const { toast } = useToast();
  const [isTestingConnection, setIsTestingConnection] = React.useState(false);
  const [connectionResult, setConnectionResult] = React.useState<any>(null);
  const [lastTestTime, setLastTestTime] = React.useState<string | null>(null);

  const testConnection = async () => {
    if (!config.accountId || !config.apiKey) {
      toast({
        title: "❌ Configuration Required",
        description: "Please enter your OANDA Account ID and API Key first",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionResult(null);

    try {
      console.log('🔄 Starting enhanced OANDA connection test...');
      
      const result = await testOANDAConnection(config);
      
      setConnectionResult({
        success: true,
        data: result,
        message: 'Connection successful!'
      });
      
      setLastTestTime(new Date().toLocaleTimeString());
      
      toast({
        title: "✅ Connection Successful",
        description: `Connected to OANDA ${config.environment} account: ${result.account?.alias || config.accountId}`,
      });

    } catch (error) {
      console.error('❌ Connection test failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setConnectionResult({
        success: false,
        error: errorMessage,
        message: 'Connection failed'
      });
      
      setLastTestTime(new Date().toLocaleTimeString());
      
      toast({
        title: "❌ Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const isDisabled = !config.accountId || !config.apiKey;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Wifi className="h-5 w-5" />
          Enhanced OANDA Connection Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={testConnection}
            disabled={isDisabled || isTestingConnection}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isTestingConnection ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Test OANDA Connection
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
          <div className={`p-4 rounded-lg border ${
            connectionResult.success 
              ? 'bg-emerald-500/10 border-emerald-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-start gap-3">
              {connectionResult.success ? (
                <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="space-y-2">
                <p className={`text-sm font-medium ${
                  connectionResult.success ? 'text-emerald-300' : 'text-red-300'
                }`}>
                  {connectionResult.message}
                </p>
                
                {connectionResult.success && connectionResult.data && (
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Account: {connectionResult.data.account?.alias || 'Unknown'}</p>
                    <p>Currency: {connectionResult.data.account?.currency || 'Unknown'}</p>
                    <p>Balance: {connectionResult.data.account?.balance || 'Unknown'}</p>
                    <p>Environment: {config.environment}</p>
                  </div>
                )}
                
                {!connectionResult.success && (
                  <div className="text-xs text-red-300">
                    <p>Error: {connectionResult.error}</p>
                    {connectionResult.error?.includes('timeout') && (
                      <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                        <p className="text-yellow-300 text-xs">
                          💡 <strong>Timeout Solutions:</strong>
                        </p>
                        <ul className="text-yellow-200 text-xs mt-1 space-y-1">
                          <li>• Check your internet connection</li>
                          <li>• Try again in a few moments</li>
                          <li>• Verify OANDA servers are operational</li>
                          <li>• Consider using a VPN if in a restricted region</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-3 bg-slate-900/50 rounded border border-slate-600">
          <h4 className="text-sm font-medium text-white mb-2">Connection Test Info</h4>
          <div className="text-xs text-slate-400 space-y-1">
            <p>• Tests multiple timeout scenarios (5s, 10s, 20s)</p>
            <p>• Validates API credentials and account access</p>
            <p>• Provides detailed error information</p>
            <p>• Environment: {config.environment}</p>
            <p>• Account ID: {config.accountId ? `${config.accountId.slice(0, 6)}...` : 'Not set'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OANDAConnectionTester;
