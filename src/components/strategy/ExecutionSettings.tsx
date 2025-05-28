
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, Play } from 'lucide-react';

interface ExecutionSettingsProps {
  strategy: {
    spread: number;
    commission: number;
    slippage: number;
  };
  onStrategyChange: (updates: any) => void;
  onRunBacktest: () => void;
  isRunning: boolean;
}

const ExecutionSettings: React.FC<ExecutionSettingsProps> = ({ 
  strategy, 
  onStrategyChange, 
  onRunBacktest, 
  isRunning 
}) => {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="h-5 w-5" />
          Execution Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="spread" className="text-slate-300">Spread (pips)</Label>
          <Input
            id="spread"
            type="number"
            step="0.1"
            value={strategy.spread}
            onChange={(e) => onStrategyChange({spread: Number(e.target.value)})}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
        <div>
          <Label htmlFor="commission" className="text-slate-300">Commission ($)</Label>
          <Input
            id="commission"
            type="number"
            step="0.1"
            value={strategy.commission}
            onChange={(e) => onStrategyChange({commission: Number(e.target.value)})}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
        <div>
          <Label htmlFor="slippage" className="text-slate-300">Slippage (pips)</Label>
          <Input
            id="slippage"
            type="number"
            step="0.1"
            value={strategy.slippage}
            onChange={(e) => onStrategyChange({slippage: Number(e.target.value)})}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>

        <Separator className="bg-slate-600" />

        <Button
          onClick={onRunBacktest}
          disabled={isRunning}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isRunning ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Running Backtest...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Backtest
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExecutionSettings;
