
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface BacktestUsage {
  count: number;
  limit: number;
  canRun: boolean;
}

interface StrategyBuilderStatusProps {
  pythonStatus: 'checking' | 'available' | 'unavailable';
  backtestUsage: BacktestUsage;
}

const StrategyBuilderStatus: React.FC<StrategyBuilderStatusProps> = ({ 
  pythonStatus, 
  backtestUsage 
}) => {
  const getPythonStatusInfo = () => {
    switch (pythonStatus) {
      case 'checking':
        return {
          icon: <Clock className="h-4 w-4" />,
          text: 'Checking Python environment...',
          variant: 'default' as const
        };
      case 'available':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Python environment ready',
          variant: 'default' as const
        };
      case 'unavailable':
        return {
          icon: <XCircle className="h-4 w-4" />,
          text: 'Python environment unavailable',
          variant: 'destructive' as const
        };
    }
  };

  const statusInfo = getPythonStatusInfo();

  return (
    <div className="space-y-4">
      <Alert variant={statusInfo.variant}>
        <div className="flex items-center gap-2">
          {statusInfo.icon}
          <AlertDescription>{statusInfo.text}</AlertDescription>
        </div>
      </Alert>

      <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-400" />
          <span className="text-slate-300">Monthly Backtest Usage</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white">
            {backtestUsage.count} / {backtestUsage.limit === Infinity ? '∞' : backtestUsage.limit}
          </span>
          <Badge variant={backtestUsage.canRun ? 'default' : 'destructive'}>
            {backtestUsage.canRun ? 'Available' : 'Limit Reached'}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default StrategyBuilderStatus;
