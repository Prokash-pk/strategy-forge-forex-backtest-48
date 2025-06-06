
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Square, Zap, TrendingUp, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';

interface AutoTradeExecutorProps {
  strategy: any;
  oandaConfig: any;
  isActive: boolean;
  onToggleTrading: () => void;
}

const AutoTradeExecutor: React.FC<AutoTradeExecutorProps> = ({
  strategy,
  oandaConfig,
  isActive,
  onToggleTrading
}) => {
  const { toast } = useToast();
  const [autoExecuteEnabled, setAutoExecuteEnabled] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecution, setLastExecution] = useState<Date | null>(null);
  const [realTradeCount, setRealTradeCount] = useState(0);
  const [accountBalance, setAccountBalance] = useState<number | null>(null);

  // Auto-execute REAL trades every 5 minutes when enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && autoExecuteEnabled && strategy && oandaConfig.accountId) {
      console.log('🚀 REAL AUTO-EXECUTION enabled - will execute REAL trades every 5 minutes');
      
      // Execute immediately when enabled
      executeRealTradeStrategy();
      
      // Then every 5 minutes
      interval = setInterval(() => {
        executeRealTradeStrategy();
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, autoExecuteEnabled, strategy, oandaConfig]);

  // Load real trade statistics on mount
  useEffect(() => {
    loadRealTradeStats();
  }, []);

  const executeRealTradeStrategy = async () => {
    if (!strategy || !oandaConfig.accountId || !oandaConfig.apiKey || isExecuting) {
      return;
    }

    setIsExecuting(true);
    try {
      console.log('🔍 Checking for REAL trading signals...');
      
      // Call the updated forward testing function that executes REAL trades
      const { data, error } = await supabase.functions.invoke('oanda-forward-testing', {
        body: {
          action: 'execute_now',
          strategy: {
            id: strategy.id,
            strategy_name: strategy.strategy_name,
            strategy_code: strategy.strategy_code,
            symbol: strategy.symbol,
            timeframe: strategy.timeframe,
            reverse_signals: strategy.reverse_signals || false
          },
          config: {
            accountId: oandaConfig.accountId,
            apiKey: oandaConfig.apiKey,
            environment: oandaConfig.environment,
            riskPerTrade: strategy.risk_per_trade || 2,
            stopLoss: strategy.stop_loss || 40,
            takeProfit: strategy.take_profit || 80,
            maxPositionSize: strategy.max_position_size || 100000
          }
        }
      });

      if (error) {
        console.error('❌ REAL trade execution error:', error);
        throw new Error(error.message || 'REAL trade execution failed');
      }

      console.log('✅ REAL trade execution response:', data);
      setLastExecution(new Date());
      
      // Update real trade count if a trade was executed
      if (data?.trade_executed && data?.execution_type === 'REAL_TRADE') {
        setRealTradeCount(prev => prev + 1);
        
        toast({
          title: "🚀 REAL Trade Executed!",
          description: `${data.signal_type} signal executed for ${strategy.symbol} - Order ID: ${data.trade_result?.orderId}`,
        });

        // Refresh account balance after trade
        await refreshAccountBalance();
      } else if (data?.signal_detected) {
        console.log(`📊 Signal detected (${data.signal_type}) but no trade executed: ${data.reason}`);
      } else {
        console.log('📊 No signals detected - monitoring continues');
      }

    } catch (error) {
      console.error('❌ REAL auto-execution error:', error);
      // Only show error toasts for actual failures, not routine "no signal" results
      if (error instanceof Error && !error.message.includes('No signal')) {
        toast({
          title: "❌ REAL Trade Execution Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const handleManualExecution = async () => {
    if (!strategy || !oandaConfig.accountId) {
      toast({
        title: "Configuration Required",
        description: "Please ensure strategy and OANDA configuration are complete",
        variant: "destructive",
      });
      return;
    }

    await executeRealTradeStrategy();
  };

  const loadRealTradeStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Count real trades from trading logs
      const { data: logs, error } = await supabase
        .from('trading_logs')
        .select('trade_data')
        .eq('user_id', user.id)
        .eq('log_type', 'trade_execution')
        .not('trade_data->execution_type', 'is', null);

      if (!error && logs) {
        const realTrades = logs.filter(log => 
          log.trade_data?.execution_type === 'REAL_TRADE'
        );
        setRealTradeCount(realTrades.length);
      }

      // Load account balance if configured
      await refreshAccountBalance();
    } catch (error) {
      console.error('Failed to load real trade stats:', error);
    }
  };

  const refreshAccountBalance = async () => {
    try {
      if (!oandaConfig.accountId || !oandaConfig.apiKey) return;

      // This should call a service to get real account balance
      // For now, we'll indicate that this needs to be implemented
      console.log('💰 Account balance refresh would call OANDA API here');
      
    } catch (error) {
      console.error('Failed to refresh account balance:', error);
    }
  };

  const isConfigured = Boolean(
    strategy?.strategy_name && 
    oandaConfig?.accountId && 
    oandaConfig?.apiKey
  );

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5" />
          REAL Trade Auto-Executor
          {isActive && (
            <Badge variant="default" className="bg-emerald-600">
              <Zap className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-white font-medium">REAL Trading Status</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {strategy?.strategy_name ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                )}
                <span className="text-slate-300 text-sm">
                  Strategy: {strategy?.strategy_name || 'Not selected'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {oandaConfig?.accountId ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                )}
                <span className="text-slate-300 text-sm">
                  OANDA: {oandaConfig?.accountId ? 'Connected' : 'Not configured'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-white font-medium">REAL Trade Statistics</h4>
            <div className="space-y-1">
              <div className="text-slate-300 text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Real Trades Executed: {realTradeCount}
              </div>
              {lastExecution && (
                <div className="text-slate-400 text-xs">
                  Last Execution: {lastExecution.toLocaleTimeString()}
                </div>
              )}
              {accountBalance !== null && (
                <div className="text-slate-300 text-sm">
                  Account Balance: ${accountBalance.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Auto-Execute Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
          <div>
            <h4 className="text-white font-medium">Auto-Execute REAL Trades</h4>
            <p className="text-slate-400 text-sm">
              Automatically execute REAL trades on OANDA when strategy signals are detected (every 5 minutes)
            </p>
            <p className="text-yellow-400 text-xs mt-1">
              ⚠️ This will place REAL orders on your OANDA account
            </p>
          </div>
          <Switch
            checked={autoExecuteEnabled}
            onCheckedChange={setAutoExecuteEnabled}
            disabled={!isActive || !isConfigured}
          />
        </div>

        {/* Manual Controls */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onToggleTrading}
            className={isActive 
              ? "bg-red-600 hover:bg-red-700" 
              : "bg-emerald-600 hover:bg-emerald-700"
            }
            disabled={!isConfigured}
          >
            {isActive ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop REAL Trading
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start REAL Trading
              </>
            )}
          </Button>

          <Button
            onClick={handleManualExecution}
            disabled={isExecuting || !isConfigured}
            variant="outline"
            className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
          >
            <Zap className="h-4 w-4 mr-2" />
            Execute REAL Trade Now
          </Button>

          <Button
            onClick={refreshAccountBalance}
            disabled={isExecuting || !isConfigured}
            variant="outline"
            className="border-green-500/30 text-green-300 hover:bg-green-500/10"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Refresh Balance
          </Button>
        </div>

        {/* Status Messages */}
        {!isConfigured && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-yellow-300 text-sm font-medium">
                Configuration Required
              </p>
              <p className="text-yellow-400 text-xs mt-1">
                Please select a strategy and configure OANDA connection to enable REAL trading.
              </p>
            </div>
          </div>
        )}

        {isActive && autoExecuteEnabled && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <Zap className="h-4 w-4 text-red-400 mt-0.5" />
            <div>
              <p className="text-red-300 text-sm font-medium">
                REAL Auto-Trading Active
              </p>
              <p className="text-red-400 text-xs mt-1">
                • System will automatically execute REAL trades on your OANDA account every 5 minutes<br />
                • Only high confidence signals (≥70%) will trigger trades<br />
                • All trades will use proper risk management and position sizing<br />
                • Real orders will include automatic stop loss and take profit levels
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoTradeExecutor;
