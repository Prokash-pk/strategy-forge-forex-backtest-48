
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ExecutionSettingsFormProps {
  strategy: {
    spread: number;
    commission: number;
    slippage: number;
  };
  onStrategyChange: (updates: any) => void;
}

const ExecutionSettingsForm: React.FC<ExecutionSettingsFormProps> = ({ strategy, onStrategyChange }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Execution Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>
    </div>
  );
};

export default ExecutionSettingsForm;
