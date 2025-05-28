
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { StrategyStorage, StrategyResult } from '@/services/strategyStorage';
import { useToast } from '@/hooks/use-toast';

interface StrategyHistoryProps {
  onStrategySelect?: (strategy: StrategyResult) => void;
}

const StrategyHistory: React.FC<StrategyHistoryProps> = ({ onStrategySelect }) => {
  const [strategies, setStrategies] = useState<StrategyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      const data = await StrategyStorage.getStrategyResults(20);
      setStrategies(data || []);
    } catch (error) {
      console.error('Failed to load strategies:', error);
      toast({
        title: "Failed to load strategy history",
        description: "Could not fetch previous strategy results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">Loading strategy history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <History className="h-5 w-5" />
          Strategy History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {strategies.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <History className="h-12 w-12 mx-auto mb-4 text-slate-500" />
            <p>No strategy results saved yet</p>
            <p className="text-sm">Run a backtest to see results here</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className="p-4 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium truncate">{strategy.strategy_name}</h4>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">
                      {strategy.symbol.replace('=X', '')} • {strategy.timeframe}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div className="text-center">
                      <div className={`flex items-center justify-center gap-1 ${
                        strategy.total_return > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {strategy.total_return > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span className="font-semibold">{strategy.total_return.toFixed(1)}%</span>
                      </div>
                      <p className="text-slate-400 text-xs">Return</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-400">
                        <Target className="h-3 w-3" />
                        <span className="font-semibold">{strategy.win_rate.toFixed(1)}%</span>
                      </div>
                      <p className="text-slate-400 text-xs">Win Rate</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-white font-semibold">{strategy.total_trades}</div>
                      <p className="text-slate-400 text-xs">Trades</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {strategy.created_at && formatDate(strategy.created_at)}
                    </span>
                    {onStrategySelect && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:text-white h-6 px-2 text-xs"
                        onClick={() => onStrategySelect(strategy)}
                      >
                        Load
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default StrategyHistory;
