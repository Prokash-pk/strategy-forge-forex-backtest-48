
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { supabase } from '@/integrations/supabase/client';
import { Bug, Database, User, Settings } from 'lucide-react';

interface TradingDebugPanelProps {
  strategy?: any;
  config?: any;
}

const TradingDebugPanel: React.FC<TradingDebugPanelProps> = ({ strategy, config }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    const info: any = {
      timestamp: new Date().toISOString(),
      user: null,
      strategy: null,
      config: null,
      database: null,
      sessions: null
    };

    try {
      // Check user
      console.log('🔍 Checking user authentication...');
      info.user = {
        authenticated: !!user,
        id: user?.id || 'Not authenticated',
        email: user?.email || 'No email'
      };

      // Check strategy
      console.log('🔍 Checking strategy...');
      info.strategy = {
        exists: !!strategy,
        name: strategy?.strategy_name || 'No strategy',
        symbol: strategy?.symbol || 'No symbol',
        timeframe: strategy?.timeframe || 'No timeframe',
        hasCode: !!(strategy?.strategy_code?.trim()),
        reverseSignals: strategy?.reverse_signals || false
      };

      // Check config
      console.log('🔍 Checking OANDA config...');
      info.config = {
        exists: !!config,
        environment: config?.environment || 'No environment',
        hasAccountId: !!(config?.accountId?.trim()),
        hasApiKey: !!(config?.apiKey?.trim()),
        accountIdLength: config?.accountId?.length || 0
      };

      // Check database connection
      console.log('🔍 Checking database connection...');
      try {
        const { data, error } = await supabase.from('trading_sessions').select('count').limit(1);
        info.database = {
          connected: !error,
          error: error?.message || null,
          canQuery: !!data
        };
      } catch (dbError) {
        info.database = {
          connected: false,
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
          canQuery: false
        };
      }

      // Check existing sessions
      console.log('🔍 Checking existing sessions...');
      try {
        const sessions = await ServerForwardTestingService.getActiveSessions();
        info.sessions = {
          count: sessions.length,
          active: sessions.filter(s => s.is_active).length,
          sessions: sessions.map(s => ({
            id: s.id,
            strategy_name: s.strategy_name,
            symbol: s.symbol,
            environment: s.environment,
            created_at: s.created_at
          }))
        };
      } catch (sessionError) {
        info.sessions = {
          error: sessionError instanceof Error ? sessionError.message : 'Unknown error',
          count: 0,
          active: 0
        };
      }

      setDebugInfo(info);
      console.log('🔍 Full diagnostic info:', info);

    } catch (error) {
      console.error('❌ Diagnostic error:', error);
      toast({
        title: "❌ Diagnostic Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectInsert = async () => {
    if (!user || !strategy || !config) {
      toast({
        title: "❌ Missing Requirements",
        description: "Need user, strategy, and config to test",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🧪 Testing direct database insert...');
      
      const testSession = {
        user_id: user.id,
        strategy_id: crypto.randomUUID(),
        strategy_name: `TEST_${strategy.strategy_name}_${Date.now()}`,
        strategy_code: strategy.strategy_code || 'TEST CODE',
        symbol: strategy.symbol,
        timeframe: strategy.timeframe,
        oanda_account_id: config.accountId,
        oanda_api_key: config.apiKey,
        environment: config.environment,
        is_active: true,
        last_execution: new Date().toISOString(),
        risk_per_trade: 2.0,
        stop_loss: 40,
        take_profit: 80,
        max_position_size: 100000,
        reverse_signals: false,
        avoid_low_volume: false
      };

      const { data, error } = await supabase
        .from('trading_sessions')
        .insert([testSession])
        .select()
        .single();

      if (error) {
        console.error('❌ Direct insert failed:', error);
        toast({
          title: "❌ Direct Insert Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('✅ Direct insert successful:', data);
        toast({
          title: "✅ Direct Insert Success",
          description: `Created test session: ${data.id}`,
        });
        
        // Clean up test session
        await supabase
          .from('trading_sessions')
          .delete()
          .eq('id', data.id);
      }

    } catch (error) {
      console.error('❌ Test insert error:', error);
      toast({
        title: "❌ Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bug className="h-5 w-5" />
          Trading Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={runDiagnostics}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Running...' : 'Run Diagnostics'}
          </Button>
          
          <Button
            onClick={testDirectInsert}
            disabled={isLoading || !user || !strategy || !config}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            Test DB Insert
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-slate-900 rounded">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                <span className="font-medium">User Status</span>
                <Badge variant={debugInfo.user?.authenticated ? "default" : "destructive"}>
                  {debugInfo.user?.authenticated ? "Authenticated" : "Not Authenticated"}
                </Badge>
              </div>
              <div className="text-slate-400">
                ID: {debugInfo.user?.id}<br/>
                Email: {debugInfo.user?.email}
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium">Strategy & Config</span>
                <Badge variant={debugInfo.strategy?.exists && debugInfo.config?.exists ? "default" : "destructive"}>
                  {debugInfo.strategy?.exists && debugInfo.config?.exists ? "Valid" : "Invalid"}
                </Badge>
              </div>
              <div className="text-slate-400">
                Strategy: {debugInfo.strategy?.name}<br/>
                Symbol: {debugInfo.strategy?.symbol}<br/>
                Has Code: {debugInfo.strategy?.hasCode ? "Yes" : "No"}<br/>
                Environment: {debugInfo.config?.environment}<br/>
                Has Credentials: {debugInfo.config?.hasAccountId && debugInfo.config?.hasApiKey ? "Yes" : "No"}
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4" />
                <span className="font-medium">Database</span>
                <Badge variant={debugInfo.database?.connected ? "default" : "destructive"}>
                  {debugInfo.database?.connected ? "Connected" : "Error"}
                </Badge>
              </div>
              <div className="text-slate-400">
                Can Query: {debugInfo.database?.canQuery ? "Yes" : "No"}<br/>
                {debugInfo.database?.error && `Error: ${debugInfo.database.error}`}
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">Active Sessions</span>
                <Badge variant={debugInfo.sessions?.count > 0 ? "default" : "secondary"}>
                  {debugInfo.sessions?.count || 0} Sessions
                </Badge>
              </div>
              {debugInfo.sessions?.sessions?.length > 0 && (
                <div className="text-slate-400">
                  {debugInfo.sessions.sessions.map((session: any, index: number) => (
                    <div key={index}>
                      {session.strategy_name} - {session.symbol} ({session.environment})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingDebugPanel;
