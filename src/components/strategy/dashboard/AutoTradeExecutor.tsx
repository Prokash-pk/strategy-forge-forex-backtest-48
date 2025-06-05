
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Square, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

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
  const [executionCount, setExecutionCount] = useState(0);

  // Auto-execute trades every 5 minutes when enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && autoExecuteEnabled && strategy && oandaConfig.accountId) {
      console.log('🚀 Auto-execution enabled - will check for signals every 5 minutes');
      
      // Execute immediately when enabled
      executeStrategyIfSignal();
      
      // Then every 5 minutes
      interval = setInterval(() => {
        executeStrategyIfSignal();
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, autoExecuteEnabled, strategy, oandaConfig]);

  const executeStrategyIfSignal = async () => {
    if (!strategy || !oandaConfig.accountId || !oandaConfig.apiKey || isExecuting) {
      return;
    }

    setIsExecuting(true);
    try {
      console.log('🔍 Checking for strategy signals...');
      
      // Call the forward testing function to execute strategy
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
        console.error('❌ Strategy execution error:', error);
        throw new Error(error.message || 'Strategy execution failed');
      }

      console.log('✅ Strategy execution response:', data);
      setLastExecution(new Date());
      setExecutionCount(prev => prev + 1);
      
      // Only show toast if actual trade was executed
      if (data?.trade_executed) {
        toast({
          title: "🚀 Trade Executed!",
          description: `${data.signal_type} signal executed for ${strategy.symbol}`,
        });
      }

    } catch (error) {
      console.error('❌ Auto-execution error:', error);
      // Don't show error toasts for routine checks that find no signals
      if (error instanceof Error && !error.message.includes('No signal')) {
        toast({
          title: "❌ Execution Error",
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

    await executeStrategyIfSignal();
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
          Automatic Trade Executor
          {isActive && (
            <Badge variant="default" className="bg-emerald-600">
              <Zap className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-white font-medium">Configuration Status</h4>
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
            <h4 className="text-white font-medium">Execution Stats</h4>
            <div className="space-y-1">
              <div className="text-slate-300 text-sm">
                Total Executions: {executionCount}
              </div>
              {lastExecution && (
                <div className="text-slate-400 text-xs">
                  Last: {lastExecution.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Auto-Execute Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
          <div>
            <h4 className="text-white font-medium">Auto-Execute Trades</h4>
            <p className="text-slate-400 text-sm">
              Automatically execute trades when strategy signals are detected (every 5 minutes)
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
                Stop Trading
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Trading
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
            Execute Now
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
                Please select a strategy and configure OANDA connection to enable trading.
              </p>
            </div>
          </div>
        )}

        {isActive && autoExecuteEnabled && (
          <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <Zap className="h-4 w-4 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-emerald-300 text-sm font-medium">
                Auto-Trading Active
              </p>
              <p className="text-emerald-400 text-xs mt-1">
                System will automatically check for signals and execute trades every 5 minutes.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoTradeExecutor;
