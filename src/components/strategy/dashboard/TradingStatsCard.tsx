
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TradingStatsCardProps {
  tradingStats: {
    totalTrades?: number;
    successfulTrades?: number;
    failedTrades?: number;
    lastExecution?: string;
  } | null;
}

const TradingStatsCard: React.FC<TradingStatsCardProps> = ({ tradingStats }) => {
  if (!tradingStats) return null;

  return (
    <Card className="bg-slate-700/50 border-slate-600">
      <CardHeader>
        <CardTitle className="text-white text-sm">Trading Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-400">Total Trades:</span>
          <span className="text-white">{tradingStats.totalTrades || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Successful:</span>
          <span className="text-emerald-400">{tradingStats.successfulTrades || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Failed:</span>
          <span className="text-red-400">{tradingStats.failedTrades || 0}</span>
        </div>
        {tradingStats.lastExecution && (
          <div className="flex justify-between">
            <span className="text-slate-400">Last Trade:</span>
            <span className="text-white text-xs">
              {new Date(tradingStats.lastExecution).toLocaleString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingStatsCard;
