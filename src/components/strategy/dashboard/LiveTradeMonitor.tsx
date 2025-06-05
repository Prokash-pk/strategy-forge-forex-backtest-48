
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LiveTrade {
  id: string;
  timestamp: string;
  action: 'BUY' | 'SELL';
  symbol: string;
  units: number;
  price: number;
  strategy_name: string;
  status: 'executed' | 'pending' | 'failed';
  transaction_id?: string;
}

interface LiveTradeMonitorProps {
  isActive: boolean;
  strategy?: any;
}

const LiveTradeMonitor: React.FC<LiveTradeMonitorProps> = ({ isActive, strategy }) => {
  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchLiveTrades = async () => {
    if (!isActive) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch recent trading logs
      const { data: logs, error } = await supabase
        .from('trading_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_type', 'trade_execution')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching trading logs:', error);
        return;
      }

      const trades = logs?.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        action: log.trade_data?.action || 'BUY',
        symbol: log.trade_data?.symbol || 'EUR_USD',
        units: log.trade_data?.units || 100,
        price: log.trade_data?.price || 0,
        strategy_name: log.trade_data?.strategy_name || strategy?.strategy_name || 'Unknown',
        status: log.trade_data?.status || 'executed',
        transaction_id: log.trade_data?.transaction_id
      })) || [];

      setLiveTrades(trades);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error in fetchLiveTrades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeTestTrade = async () => {
    if (!strategy) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generate a simulated trade based on current strategy
      const testTrade = {
        action: Math.random() > 0.5 ? 'BUY' : 'SELL',
        symbol: strategy.symbol?.replace('/', '_') || 'EUR_USD',
        units: 100,
        price: 1.0950 + (Math.random() - 0.5) * 0.01,
        strategy_name: strategy.strategy_name,
        timestamp: new Date().toISOString(),
        status: 'executed',
        transaction_id: `test_${Date.now()}`
      };

      // Log the trade
      const { error } = await supabase
        .from('trading_logs')
        .insert({
          user_id: user.id,
          session_id: crypto.randomUUID(),
          log_type: 'trade_execution',
          message: `Test trade executed: ${testTrade.action} ${testTrade.units} units of ${testTrade.symbol}`,
          trade_data: testTrade
        });

      if (error) {
        console.error('Error logging test trade:', error);
      } else {
        console.log('Test trade logged successfully:', testTrade);
        // Refresh the trades list
        await fetchLiveTrades();
      }
    } catch (error) {
      console.error('Error executing test trade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTrades();
    
    // Set up real-time updates
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(fetchLiveTrades, 10000); // Every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, strategy]);

  if (!isActive) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5" />
            Live Trade Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">Start autonomous trading to monitor live trades</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Trade Monitor
            <Badge variant="default" className="bg-emerald-600">
              Active
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={executeTestTrade}
              disabled={isLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
              Test Trade
            </Button>
            <Button
              onClick={fetchLiveTrades}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="border-slate-600"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="h-3 w-3" />
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </CardHeader>
      <CardContent>
        {liveTrades.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">No trades executed yet</p>
            <p className="text-xs text-slate-500 mb-4">
              Strategy: {strategy?.strategy_name || 'No strategy selected'}
            </p>
            <Button
              onClick={executeTestTrade}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Execute Test Trade
            </Button>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {liveTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    className={`${
                      trade.action === 'BUY'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {trade.action}
                  </Badge>
                  <div>
                    <div className="text-white font-medium">
                      {trade.units.toLocaleString()} {trade.symbol}
                    </div>
                    <div className="text-xs text-slate-400">
                      {trade.strategy_name}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-mono">
                    {trade.price.toFixed(5)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <Badge
                  variant={
                    trade.status === 'executed'
                      ? 'default'
                      : trade.status === 'pending'
                      ? 'secondary'
                      : 'destructive'
                  }
                  className="text-xs"
                >
                  {trade.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveTradeMonitor;
