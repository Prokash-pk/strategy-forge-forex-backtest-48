
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, Shield } from 'lucide-react';

interface PerformanceMetricsProps {
  results: any;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ results }) => {
  const performanceMetrics = [
    {
      label: 'Total Return',
      value: `${(results.totalReturn || 0).toFixed(2)}%`,
      icon: TrendingUp,
      color: (results.totalReturn || 0) > 0 ? 'text-emerald-400' : 'text-red-400',
      bgColor: (results.totalReturn || 0) > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
    },
    {
      label: 'Win Rate',
      value: `${(results.winRate || 0).toFixed(1)}%`,
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Max Drawdown',
      value: `${(results.maxDrawdown || 0).toFixed(2)}%`,
      icon: TrendingDown,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    },
    {
      label: 'Sharpe Ratio',
      value: (results.sharpeRatio || 0).toFixed(2),
      icon: Shield,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {performanceMetrics.map((metric, index) => (
        <Card key={index} className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">{metric.label}</p>
                <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
              </div>
              <div className={`p-3 rounded-full ${metric.bgColor}`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PerformanceMetrics;
