
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Trash2 } from 'lucide-react';

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
  onLoadStrategy: (strategy: StrategySettings) => void;
  onDeleteStrategy: (strategyId: string) => void;
  onRefresh: () => void;
}

const OANDAStrategySettings: React.FC<OANDAStrategySettingsProps> = ({
  savedStrategies,
  selectedStrategy,
  onLoadStrategy,
  onDeleteStrategy,
  onRefresh
}) => {
  if (savedStrategies.length === 0) {
    return null;
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <BarChart3 className="h-5 w-5" />
          Strategy Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-400 text-sm">
          Select a saved strategy with specific settings for forward testing. The trades will be executed based on these settings.
        </p>
        
        {selectedStrategy && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <h4 className="text-emerald-400 font-medium mb-3">{selectedStrategy.strategy_name}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-300">
              <div>
                <span className="text-slate-400">Symbol:</span>
                <div className="font-medium">{selectedStrategy.symbol}</div>
              </div>
              <div>
                <span className="text-slate-400">Timeframe:</span>
                <div className="font-medium">{selectedStrategy.timeframe}</div>
              </div>
              <div>
                <span className="text-slate-400">Initial Balance:</span>
                <div className="font-medium">${selectedStrategy.initial_balance?.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-slate-400">Risk per Trade:</span>
                <div className="font-medium">{selectedStrategy.risk_per_trade}%</div>
              </div>
              <div>
                <span className="text-slate-400">Stop Loss:</span>
                <div className="font-medium">{selectedStrategy.stop_loss} pips</div>
              </div>
              <div>
                <span className="text-slate-400">Take Profit:</span>
                <div className="font-medium">{selectedStrategy.take_profit} pips</div>
              </div>
              <div>
                <span className="text-slate-400">Risk/Reward:</span>
                <div className="font-medium">{selectedStrategy.risk_reward_ratio}:1</div>
              </div>
              <div>
                <span className="text-slate-400">Max Position:</span>
                <div className="font-medium">{selectedStrategy.max_position_size?.toLocaleString()}</div>
              </div>
              {selectedStrategy.win_rate && (
                <div>
                  <span className="text-slate-400">Win Rate:</span>
                  <div className="font-medium text-emerald-400">{selectedStrategy.win_rate.toFixed(1)}%</div>
                </div>
              )}
              {selectedStrategy.total_return !== undefined && (
                <div>
                  <span className="text-slate-400">Total Return:</span>
                  <div className={`font-medium ${selectedStrategy.total_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedStrategy.total_return >= 0 ? '+' : ''}{selectedStrategy.total_return.toFixed(1)}%
                  </div>
                </div>
              )}
              {selectedStrategy.profit_factor && (
                <div>
                  <span className="text-slate-400">Profit Factor:</span>
                  <div className="font-medium">{selectedStrategy.profit_factor.toFixed(2)}</div>
                </div>
              )}
              {selectedStrategy.max_drawdown && (
                <div>
                  <span className="text-slate-400">Max Drawdown:</span>
                  <div className="font-medium text-red-400">{selectedStrategy.max_drawdown.toFixed(1)}%</div>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant={selectedStrategy.reverse_signals ? "destructive" : "secondary"} className="text-xs">
                {selectedStrategy.reverse_signals ? "Reverse Signals" : "Normal Signals"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {selectedStrategy.position_sizing_mode}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {selectedStrategy.risk_model}
              </Badge>
            </div>
          </div>
        )}
        
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {savedStrategies.map((strategySettings) => (
            <div key={strategySettings.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <div className="flex-1">
                <h4 className="text-white font-medium">{strategySettings.strategy_name}</h4>
                <p className="text-slate-400 text-sm">
                  {strategySettings.symbol} • {strategySettings.timeframe} • Risk: {strategySettings.risk_per_trade}%
                  {strategySettings.win_rate && ` • Win Rate: ${strategySettings.win_rate.toFixed(1)}%`}
                  {strategySettings.total_return !== undefined && (
                    <span className={strategySettings.total_return >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {' '}• Return: {strategySettings.total_return >= 0 ? '+' : ''}{strategySettings.total_return.toFixed(1)}%
                    </span>
                  )}
                </p>
                <p className="text-slate-500 text-xs">
                  SL: {strategySettings.stop_loss} | TP: {strategySettings.take_profit} | R/R: {strategySettings.risk_reward_ratio}:1
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedStrategy?.id === strategySettings.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onLoadStrategy(strategySettings)}
                  className={selectedStrategy?.id === strategySettings.id 
                    ? "bg-emerald-600 hover:bg-emerald-700" 
                    : "border-slate-600 text-slate-300 hover:text-white"
                  }
                >
                  {selectedStrategy?.id === strategySettings.id ? "Selected" : "Select"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteStrategy(strategySettings.id)}
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OANDAStrategySettings;
