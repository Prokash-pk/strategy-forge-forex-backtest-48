
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AccountSummaryCard from '../AccountSummaryCard';

interface TradingOverviewTabProps {
  strategyName: string;
  accountBalance: number;
  positionsCount: number;
  totalPL: number;
  environment: 'practice' | 'live';
  accountId: string;
  isLoading: boolean;
  onRefresh: () => void;
  tradingStats: any;
  strategy: any;
}

const TradingOverviewTab: React.FC<TradingOverviewTabProps> = ({
  strategyName,
  accountBalance,
  positionsCount,
  totalPL,
  environment,
  accountId,
  isLoading,
  onRefresh,
  tradingStats,
  strategy
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AccountSummaryCard 
        strategyName={strategyName}
        accountBalance={accountBalance}
        positionsCount={positionsCount}
        totalPL={totalPL}
        environment={environment}
        accountId={accountId}
        isLoading={isLoading}
        onRefresh={onRefresh}
      />
      
      {tradingStats && (
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
      )}

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
    </div>
  );
};

export default TradingOverviewTab;
