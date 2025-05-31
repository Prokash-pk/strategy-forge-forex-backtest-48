
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, AlertCircle } from 'lucide-react';
import PerformanceMetrics from './backtest/PerformanceMetrics';
import StatisticsCards from './backtest/StatisticsCards';
import EquityCurveChart from './backtest/EquityCurveChart';
import MonthlyReturnsChart from './backtest/MonthlyReturnsChart';
import TradeLogTable from './backtest/TradeLogTable';
import StrategyInfo from './backtest/StrategyInfo';
import StrategyCoach from './backtest/StrategyCoach';

interface BacktestResultsProps {
  results: any;
}

const BacktestResults: React.FC<BacktestResultsProps> = ({ results }) => {
  if (!results) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Backtest Results</h3>
          <p className="text-slate-400">
            Run a backtest from the Strategy Builder to see detailed performance results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5" />
            Backtest Results Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatisticsCards results={results} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <StrategyInfo results={results} />
        <PerformanceMetrics results={results} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <EquityCurveChart equityCurve={results.equityCurve} />
        <MonthlyReturnsChart monthlyReturns={results.monthlyReturns} />
      </div>

      <TradeLogTable 
        trades={results.trades || []} 
        strategyName={results.strategy?.name}
      />

      <StrategyCoach results={results} />
    </div>
  );
};

export default BacktestResults;
