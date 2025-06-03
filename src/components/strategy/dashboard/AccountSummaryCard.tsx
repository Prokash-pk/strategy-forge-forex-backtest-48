
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Activity, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';

interface AccountSummaryCardProps {
  strategyName: string;
  accountBalance: number;
  positionsCount: number;
  totalPL: number;
  environment: 'practice' | 'live';
  accountId: string;
  isLoading: boolean;
  onRefresh: () => void;
}

const AccountSummaryCard: React.FC<AccountSummaryCardProps> = ({
  strategyName,
  accountBalance,
  positionsCount,
  totalPL,
  environment,
  accountId,
  isLoading,
  onRefresh
}) => {
  return (
    <Card className="bg-slate-800 border-slate-700 w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Live OANDA Account - {strategyName || 'No Strategy'}</span>
          </CardTitle>
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:text-white w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Live Data
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="text-center p-3 bg-slate-700/50 rounded-lg">
            <DollarSign className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-lg font-semibold text-white">
              ${accountBalance.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400">Live Account Balance</p>
          </div>
          <div className="text-center p-3 bg-slate-700/50 rounded-lg">
            <Activity className="h-4 w-4 text-blue-400 mx-auto mb-1" />
            <div className="text-lg font-semibold text-white">
              {positionsCount}
            </div>
            <p className="text-xs text-slate-400">Open Positions</p>
          </div>
          <div className="text-center p-3 bg-slate-700/50 rounded-lg">
            <TrendingUp className={`h-4 w-4 mx-auto mb-1 ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
            <div className={`text-lg font-semibold ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400">Unrealized P&L</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="text-emerald-300 text-xs sm:text-sm font-medium break-words">
              Live connection to OANDA {environment} account: {accountId}
            </span>
          </div>
          <p className="text-emerald-400 text-xs mt-1">
            Data refreshes every 30 seconds • Autonomous trading active
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountSummaryCard;
