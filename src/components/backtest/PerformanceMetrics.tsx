
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, Shield } from 'lucide-react';

interface PerformanceMetricsProps {
  results: any;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ results }) => {
  const performanceMetrics = [
    {
      label: 'Profit Factor',
      value: results.profitFactor.toFixed(2),
      icon: Target,
      color: results.profitFactor > 1.5 ? 'text-emerald-400' : results.profitFactor > 1 ? 'text-blue-400' : 'text-red-400',
      bgColor: results.profitFactor > 1.5 ? 'bg-emerald-500/10' : results.profitFactor > 1 ? 'bg-blue-500/10' : 'bg-red-500/10',
      performance: results.profitFactor > 1.5 ? 'Excellent' : results.profitFactor > 1 ? 'Good' : 'Poor'
    },
    {
      label: 'Risk-Reward Ratio',
      value: (results.avgWin / Math.abs(results.avgLoss)).toFixed(2),
      icon: Shield,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      performance: (results.avgWin / Math.abs(results.avgLoss)) > 2 ? 'Strong' : 'Moderate'
    },
    {
      label: 'Total Trades',
      value: results.totalTrades.toString(),
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      performance: results.totalTrades > 100 ? 'High Volume' : 'Low Volume'
    },
    {
      label: 'Average Trade',
      value: `$${((results.finalBalance - results.initialBalance) / results.totalTrades).toFixed(2)}`,
      icon: TrendingDown,
      color: ((results.finalBalance - results.initialBalance) / results.totalTrades) > 0 ? 'text-emerald-400' : 'text-red-400',
      bgColor: ((results.finalBalance - results.initialBalance) / results.totalTrades) > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      performance: ((results.finalBalance - results.initialBalance) / results.totalTrades) > 0 ? 'Profitable' : 'Loss'
    }
  ];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          📊 Risk & Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${metric.bgColor}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">{metric.label}</p>
                  <p className={`text-lg font-bold ${metric.color}`}>{metric.value}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full ${metric.bgColor} ${metric.color}`}>
                  {metric.performance}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;
