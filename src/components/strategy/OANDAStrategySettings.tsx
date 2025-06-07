
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Trash2, TrendingUp, Loader2, RefreshCw } from 'lucide-react';

interface StrategySettings {
  id: string;
  strategy_name: string;
  strategy_code: string;
  symbol: string;
  timeframe: string;
  initial_balance: number;
  risk_per_trade: number;
  stop_loss: number;
  take_profit: number;
  spread: number;
  commission: number;
  slippage: number;
  max_position_size: number;
  risk_model: string;
  reverse_signals: boolean;
  position_sizing_mode: string;
  risk_reward_ratio: number;
  win_rate?: number;
  total_trades?: number;
  total_return?: number;
  profit_factor?: number;
  max_drawdown?: number;
}

interface OANDAStrategySettingsProps {
  savedStrategies: StrategySettings[];
  selectedStrategy: StrategySettings | null;
  isLoadingStrategies?: boolean;
  onLoadStrategy: (strategy: StrategySettings) => void;
  onDeleteStrategy: (strategyId: string) => void;
  onRefresh: () => void;
}

const OANDAStrategySettings: React.FC<OANDAStrategySettingsProps> = ({
  savedStrategies,
  selectedStrategy,
  isLoadingStrategies = false,
  onLoadStrategy,
  onDeleteStrategy,
  onRefresh
}) => {
  // Loading state with minimal skeletons for faster rendering
  if (isLoadingStrategies) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5" />
            Strategy Settings
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-64 bg-slate-700" />
            <Skeleton className="h-8 w-16 bg-slate-700" />
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="p-3 bg-slate-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-5 w-40 bg-slate-700" />
                <Skeleton className="h-6 w-16 bg-slate-700" />
              </div>
              <Skeleton className="h-4 w-full bg-slate-700" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Quick empty state
  if (savedStrategies.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5" />
            Strategy Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-slate-400 mb-4">No strategies found. Create and save a strategy first.</p>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Find high-return strategy quickly
  const highReturnStrategy = savedStrategies.find(s => 
    s.strategy_name?.toLowerCase().includes('smart momentum') && 
    s.total_return && s.total_return > 60
  );

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <BarChart3 className="h-5 w-5" />
          Strategy Settings
          {highReturnStrategy && (
            <Badge className="bg-emerald-500 text-white">
              <TrendingUp className="h-3 w-3 mr-1" />
              High Return Found!
            </Badge>
          )}
          <span className="text-sm text-slate-400 ml-auto">
            {savedStrategies.length} strategies
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-sm">
            Select a strategy for forward testing. Trades will execute based on these settings.
          </p>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
        
        {/* Selected strategy display */}
        {selectedStrategy && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <h4 className="text-emerald-400 font-medium mb-3">{selectedStrategy.strategy_name}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-slate-300">
              <div>
                <span className="text-slate-400">Symbol:</span>
                <div className="font-medium">{selectedStrategy.symbol}</div>
              </div>
              <div>
                <span className="text-slate-400">Risk:</span>
                <div className="font-medium">{selectedStrategy.risk_per_trade}%</div>
              </div>
              <div>
                <span className="text-slate-400">Stop Loss:</span>
                <div className="font-medium">{selectedStrategy.stop_loss} pips</div>
              </div>
              {selectedStrategy.total_return !== undefined && (
                <div>
                  <span className="text-slate-400">Return:</span>
                  <div className={`font-medium ${selectedStrategy.total_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedStrategy.total_return >= 0 ? '+' : ''}{selectedStrategy.total_return.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Strategy list - simplified for faster rendering */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {savedStrategies.slice(0, 10).map((strategy) => (
            <div key={strategy.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-medium truncate">{strategy.strategy_name}</h4>
                  {strategy.total_return && strategy.total_return > 60 && (
                    <Badge className="bg-emerald-500 text-white text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {strategy.total_return.toFixed(0)}%
                    </Badge>
                  )}
                </div>
                <p className="text-slate-400 text-sm truncate">
                  {strategy.symbol} • {strategy.timeframe} • Risk: {strategy.risk_per_trade}%
                  {strategy.total_return !== undefined && (
                    <span className={strategy.total_return >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {' '}• {strategy.total_return >= 0 ? '+' : ''}{strategy.total_return.toFixed(1)}%
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <Button
                  variant={selectedStrategy?.id === strategy.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onLoadStrategy(strategy)}
                  className={selectedStrategy?.id === strategy.id 
                    ? "bg-emerald-600 hover:bg-emerald-700" 
                    : "border-slate-600 text-slate-300 hover:text-white"
                  }
                >
                  {selectedStrategy?.id === strategy.id ? "Selected" : "Select"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteStrategy(strategy.id)}
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {savedStrategies.length > 10 && (
          <p className="text-slate-500 text-xs text-center">
            Showing first 10 strategies. Use refresh to see all.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default OANDAStrategySettings;
