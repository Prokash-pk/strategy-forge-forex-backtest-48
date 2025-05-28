
import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3 } from 'lucide-react';
import PerformanceMetrics from './backtest/PerformanceMetrics';
import StrategyInfo from './backtest/StrategyInfo';
import EquityCurveChart from './backtest/EquityCurveChart';
import MonthlyReturnsChart from './backtest/MonthlyReturnsChart';
import TradeLogTable from './backtest/TradeLogTable';
import StatisticsCards from './backtest/StatisticsCards';

interface BacktestResultsProps {
  results: any;
}

const BacktestResults: React.FC<BacktestResultsProps> = ({ results }) => {
  if (!results) {
    return (
      <Card className="bg-slate-800 border-slate-700 p-8">
        <div className="text-center text-slate-400">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold mb-2">No Backtest Results</h3>
          <p>Run a backtest from the Strategy Builder to see results here</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <PerformanceMetrics results={results} />

      {/* Strategy Info */}
      <StrategyInfo results={results} />

      {/* Charts and Details */}
      <Tabs defaultValue="equity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
          <TabsTrigger value="equity" className="data-[state=active]:bg-emerald-600">Equity Curve</TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-emerald-600">Monthly Returns</TabsTrigger>
          <TabsTrigger value="trades" className="data-[state=active]:bg-emerald-600">Trade Log ({results.trades.length})</TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-emerald-600">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="equity">
          <EquityCurveChart equityCurve={results.equityCurve} />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyReturnsChart />
        </TabsContent>

        <TabsContent value="trades">
          <TradeLogTable trades={results.trades} />
        </TabsContent>

        <TabsContent value="stats">
          <StatisticsCards results={results} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BacktestResults;
