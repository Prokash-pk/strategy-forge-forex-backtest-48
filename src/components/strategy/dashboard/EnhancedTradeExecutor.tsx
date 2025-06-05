
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Square, Zap, TrendingUp, Clock } from 'lucide-react';

interface EnhancedTradeExecutorProps {
  strategy: any;
  oandaConfig: any;
  isActive: boolean;
  onToggleTrading: () => void;
}

const EnhancedTradeExecutor: React.FC<EnhancedTradeExecutorProps> = ({
  strategy,
  oandaConfig,
  isActive,
  onToggleTrading
}) => {
  const { toast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecution, setLastExecution] = useState<Date | null>(null);

  const executeStrategySignals = async () => {
    if (!strategy || !oandaConfig.accountId || !oandaConfig.apiKey) {
      toast({
        title: "Configuration Required",
        description: "Please ensure strategy and OANDA configuration are complete",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    try {
      console.log('🚀 Executing strategy signals for live trading...');
      
      // Call the forward testing function to trigger immediate execution
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
        throw new Error(error.message || 'Strategy execution failed');
      }

      console.log('✅ Strategy execution response:', data);
      setLastExecution(new Date());
      
      toast({
        title: "✅ Strategy Executed",
        description: `Strategy "${strategy.strategy_name}" executed successfully. Check trade monitor for results.`,
      });

    } catch (error) {
      console.error('❌ Strategy execution error:', error);
      toast({
        title: "❌ Execution Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const testStrategy = async () => {
    if (!strategy) return;
    
    setIsExecuting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create a test signal and log it
      const testSignal = {
        action: Math.random() > 0.5 ? 'BUY' : 'SELL',
        symbol: strategy.symbol?.replace('/', '_') || 'EUR_USD',
        units: 100,
        price: 1.0950 + (Math.random() - 0.5) * 0.01,
        strategy_name: strategy.strategy_name,
        timestamp: new Date().toISOString(),
        status: 'executed',
        transaction_id: `test_${Date.now()}`,
        test_mode: true
      };

      // Log the test trade
      const { error } = await supabase
        .from('trading_logs')
        .insert({
          user_id: user.id,
          session_id: crypto.randomUUID(),
          log_type: 'trade_execution',
          message: `Test signal generated: ${testSignal.action} ${testSignal.units} units of ${testSignal.symbol} at ${testSignal.price}`,
          trade_data: testSignal
        });

      if (error) {
        throw error;
      }

      setLastExecution(new Date());
      toast({
        title: "🧪 Test Signal Generated",
        description: `${testSignal.action} signal for ${testSignal.symbol} at ${testSignal.price.toFixed(5)}`,
      });

    } catch (error) {
      console.error('Test strategy error:', error);
      toast({
        title: "Test Failed",
        description: "Failed to generate test signal",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5" />
          Strategy Execution Control
          {isActive && (
            <Badge variant="default" className="bg-emerald-600">
              <Zap className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-white font-medium">Current Strategy</h4>
            <p className="text-slate-400 text-sm">
              {strategy?.strategy_name || 'No strategy selected'}
            </p>
            <p className="text-slate-500 text-xs">
              Symbol: {strategy?.symbol || 'N/A'} • Timeframe: {strategy?.timeframe || 'N/A'}
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-white font-medium">Execution Status</h4>
            <div className="flex items-center gap-2">
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
              {lastExecution && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  Last: {lastExecution.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-slate-600" />

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onToggleTrading}
            className={isActive 
              ? "bg-red-600 hover:bg-red-700" 
              : "bg-emerald-600 hover:bg-emerald-700"
            }
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
            onClick={executeStrategySignals}
            disabled={isExecuting || !strategy}
            variant="outline"
            className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
          >
            <Zap className="h-4 w-4 mr-2" />
            Execute Now
          </Button>

          <Button
            onClick={testStrategy}
            disabled={isExecuting || !strategy}
            variant="outline"
            className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Test Signal
          </Button>
        </div>

        {isActive && (
          <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <Zap className="h-4 w-4 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-emerald-300 text-sm font-medium">
                Live Trading Active
              </p>
              <p className="text-emerald-400 text-xs mt-1">
                Strategy signals are being executed automatically every 5 minutes.
                Use "Execute Now" to trigger immediate execution or "Test Signal" to generate test data.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTradeExecutor;
