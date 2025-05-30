
import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import PerformanceMetrics from './backtest/PerformanceMetrics';
import StrategyInfo from './backtest/StrategyInfo';
import EquityCurveChart from './backtest/EquityCurveChart';
import MonthlyReturnsChart from './backtest/MonthlyReturnsChart';
import TradeLogTable from './backtest/TradeLogTable';
import StatisticsCards from './backtest/StatisticsCards';

interface BacktestResultsProps {
  results: any;
  onAddToStrategy?: (codeSnippet: string) => void;
  onTestReverseStrategy?: () => void;
  isReverseTestRunning?: boolean;
}

const BacktestResults: React.FC<BacktestResultsProps> = ({ 
  results, 
  onAddToStrategy, 
  onTestReverseStrategy,
  isReverseTestRunning = false 
}) => {
  console.log('BacktestResults received results:', results);

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
      {/* Enhanced Execution Status */}
      {results.enhancedFeatures && (
        <Card className="bg-slate-800 border-slate-700">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  <span className="text-white font-medium">Enhanced Backtest Execution</span>
                </div>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">
                  {results.executionMethod}
                </Badge>
                {results.reverse_signals_applied && (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-400">
                    Reversed Signals
                  </Badge>
                )}
              </div>
              
              {/* Test Reverse Strategy Button */}
              {onTestReverseStrategy && (
                <Button
                  onClick={onTestReverseStrategy}
                  disabled={isReverseTestRunning}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:text-white hover:border-slate-500"
                >
                  <RotateCcw className={`h-4 w-4 mr-2 ${isReverseTestRunning ? 'animate-spin' : ''}`} />
                  {isReverseTestRunning ? 'Testing Reverse...' : 'Test Reverse Strategy'}
                </Button>
              )}
            </div>
            
            {/* Enhanced Features Grid */}
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {results.enhancedFeatures.dynamicSpreads ? 
                  <CheckCircle className="h-4 w-4 text-emerald-400" /> : 
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                }
                <span className="text-slate-300">Dynamic Spreads</span>
              </div>
              <div className="flex items-center gap-2">
                {results.enhancedFeatures.realisticSlippage ? 
                  <CheckCircle className="h-4 w-4 text-emerald-400" /> : 
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                }
                <span className="text-slate-300">Realistic Slippage</span>
              </div>
              <div className="flex items-center gap-2">
                {results.enhancedFeatures.advancedPositionSizing ? 
                  <CheckCircle className="h-4 w-4 text-emerald-400" /> : 
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                }
                <span className="text-slate-300">Advanced Position Sizing</span>
              </div>
              <div className="flex items-center gap-2">
                {results.enhancedFeatures.marketImpact ? 
                  <CheckCircle className="h-4 w-4 text-emerald-400" /> : 
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                }
                <span className="text-slate-300">Market Impact</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <PerformanceMetrics results={results} />

      {/* Strategy Info */}
      <StrategyInfo results={results} />

      {/* Charts and Details */}
      <Tabs defaultValue="equity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
          <TabsTrigger value="equity" className="data-[state=active]:bg-emerald-600">Equity Curve</TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-emerald-600">Monthly Returns</TabsTrigger>
          <TabsTrigger value="trades" className="data-[state=active]:bg-emerald-600">Trade Log ({results.trades?.length || 0})</TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-emerald-600">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="equity">
          <EquityCurveChart equityCurve={results.equityCurve} />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyReturnsChart />
        </TabsContent>

        <TabsContent value="trades">
          <TradeLogTable trades={results.trades || []} />
        </TabsContent>

        <TabsContent value="stats">
          <StatisticsCards results={results} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BacktestResults;
