
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Database, Code, TrendingUp } from 'lucide-react';

interface BacktestProgressProps {
  currentStep: string;
}

const BacktestProgress: React.FC<BacktestProgressProps> = ({ currentStep }) => {
  if (!currentStep) return null;

  const getStepInfo = (step: string) => {
    if (step.includes('Fetching')) {
      return { icon: Database, progress: 25, color: 'text-blue-400' };
    }
    if (step.includes('Validating')) {
      return { icon: Code, progress: 50, color: 'text-yellow-400' };
    }
    if (step.includes('Running')) {
      return { icon: TrendingUp, progress: 75, color: 'text-purple-400' };
    }
    if (step.includes('completed')) {
      return { icon: TrendingUp, progress: 100, color: 'text-emerald-400' };
    }
    return { icon: Loader2, progress: 10, color: 'text-slate-400' };
  };

  const { icon: Icon, progress, color } = getStepInfo(currentStep);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Icon className={`h-5 w-5 ${color} ${Icon === Loader2 ? 'animate-spin' : ''}`} />
          <span className="text-sm text-slate-300 font-medium">{currentStep}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="text-xs text-slate-500 mt-2">
          Processing real market data...
        </div>
      </CardContent>
    </Card>
  );
};

export default BacktestProgress;
