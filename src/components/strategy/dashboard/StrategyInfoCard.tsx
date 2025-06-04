
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StrategyInfoCardProps {
  strategy: {
    strategy_name?: string;
    symbol?: string;
    timeframe?: string;
    total_return?: number;
  } | null;
}

const StrategyInfoCard: React.FC<StrategyInfoCardProps> = ({ strategy }) => {
  return (
    <Card className="bg-slate-700/50 border-slate-600">
      <CardHeader>
        <CardTitle className="text-white text-sm">Strategy Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-400">Name:</span>
          <span className="text-white text-xs">{strategy?.strategy_name || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Symbol:</span>
          <span className="text-white">{strategy?.symbol || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Timeframe:</span>
          <span className="text-white">{strategy?.timeframe || 'N/A'}</span>
        </div>
        {strategy?.total_return && (
          <div className="flex justify-between">
            <span className="text-slate-400">Backtest Return:</span>
            <span className="text-emerald-400">{strategy.total_return.toFixed(2)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StrategyInfoCard;
