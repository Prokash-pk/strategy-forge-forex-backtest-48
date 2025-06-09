
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, Square, Zap, TestTube, Activity, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedTradeExecutorProps {
  strategy: any;
  oandaConfig: {
    accountId: string;
    apiKey: string;
    environment: 'practice' | 'live';
  };
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
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const [isGeneratingSignal, setIsGeneratingSignal] = useState(false);

  const handleExecuteRealTradeNow = async () => {
    if (!strategy || !oandaConfig.accountId || !oandaConfig.apiKey) {
      toast({
        title: "⚠️ Missing Configuration",
        description: "Please ensure strategy and OANDA configuration are complete",
        variant: "destructive",
      });
      return;
    }

    setIsExecutingTrade(true);
    try {
      console.log('🚀 Executing real trade now for strategy:', strategy.strategy_name);
      
      // Call the OANDA forward testing edge function to execute immediately
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
            riskPerTrade: 2.0,
            stopLoss: 40,
            takeProfit: 80,
            maxPositionSize: 10000
          }
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      console.log('📊 Trade execution result:', data);

      if (data.success) {
        if (data.trade_executed) {
          toast({
            title: "🎉 Trade Executed Successfully!",
            description: `${data.signal_type} signal executed at ${data.current_price} with ${data.confidence}% confidence`,
          });
        } else {
          toast({
            title: "📊 Analysis Complete",
            description: data.reason || `${data.signal_type || 'No'} signal detected with ${data.confidence}% confidence`,
          });
        }
      } else {
        throw new Error(data.error || 'Trade execution failed');
      }

    } catch (error) {
      console.error('❌ Failed to execute real trade:', error);
      toast({
        title: "❌ Trade Execution Failed",
        description: error instanceof Error ? error.message : "Could not execute trade",
        variant: "destructive",
      });
    } finally {
      setIsExecutingTrade(false);
    }
  };

  const handleGenerateTestSignal = async () => {
    setIsGeneratingSignal(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate a test trading log entry
      const testSignal = {
        signal: Math.random() > 0.5 ? 'BUY' : 'SELL',
        symbol: strategy.symbol,
        confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
        currentPrice: 1.0500 + (Math.random() - 0.5) * 0.02, // Simulated price
        strategyName: strategy.strategy_name
      };

      await supabase.from('trading_logs').insert({
        user_id: user.id,
        session_id: crypto.randomUUID(),
        log_type: 'info',
        message: `TEST SIGNAL: ${testSignal.signal} ${testSignal.symbol} at ${testSignal.currentPrice.toFixed(5)}`,
        trade_data: {
          test_signal: true,
          signal_data: testSignal,
          timestamp: new Date().toISOString()
        }
      });

      toast({
        title: "🧪 Test Signal Generated",
        description: `${testSignal.signal} signal for ${testSignal.symbol} with ${testSignal.confidence}% confidence`,
      });

    } catch (error) {
      console.error('Failed to generate test signal:', error);
      toast({
        title: "❌ Failed to Generate Test Signal",
        description: "Could not create test trading data",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSignal(false);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Zap className="h-5 w-5" />
          Real-Time Trade Execution
          {isActive && (
            <Badge variant="default" className="bg-emerald-600">
              <Activity className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Strategy Info */}
        <div className="p-3 bg-slate-900/50 rounded border border-slate-600">
          <h4 className="text-white font-medium mb-2">Active Strategy</h4>
          <div className="text-sm text-slate-400 space-y-1">
            <div>Name: <span className="text-white">{strategy?.strategy_name || 'No strategy selected'}</span></div>
            <div>Symbol: <span className="text-white">{strategy?.symbol || 'N/A'}</span></div>
            <div>Timeframe: <span className="text-white">{strategy?.timeframe || 'N/A'}</span></div>
            <div>Environment: <span className="text-white capitalize">{oandaConfig.environment}</span></div>
          </div>
        </div>

        <Separator className="bg-slate-600" />

        {/* Immediate Execution */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Immediate Actions</h4>
          
          <Button
            onClick={handleExecuteRealTradeNow}
            disabled={isExecutingTrade || !strategy || !oandaConfig.accountId}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
            size="lg"
          >
            {isExecutingTrade ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Market & Executing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Execute REAL Trade Now
              </>
            )}
          </Button>

          <Button
            onClick={handleGenerateTestSignal}
            disabled={isGeneratingSignal}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:text-white"
          >
            {isGeneratingSignal ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Generate Test Signal
              </>
            )}
          </Button>
        </div>

        <Separator className="bg-slate-600" />

        {/* Trading Control */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Trading Control</h4>
          
          <Button
            onClick={onToggleTrading}
            className={`w-full ${isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            size="lg"
          >
            {isActive ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Live Trading
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Live Trading
              </>
            )}
          </Button>
        </div>

        {/* Warning for Live Environment */}
        {oandaConfig.environment === 'live' && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-red-400 font-medium">Live Trading Mode</span>
            </div>
            <p className="text-slate-400 text-sm">
              You are trading with real money. All trades will use actual funds.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="text-xs text-slate-500 bg-slate-900/30 p-3 rounded">
          <div className="mb-2 font-medium">How it works:</div>
          <ul className="space-y-1">
            <li>• "Execute REAL Trade Now" analyzes current market conditions immediately</li>
            <li>• If your strategy detects a signal with ≥70% confidence, a real trade is placed</li>
            <li>• "Generate Test Signal" creates sample data for testing the monitoring system</li>
            <li>• All executions are logged and can be viewed in the diagnostics</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedTradeExecutor;
