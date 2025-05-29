
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RiskManagementSettingsProps {
  strategy: {
    initialBalance: number;
    riskPerTrade: number;
    stopLoss: number;
    takeProfit: number;
    maxPositionSize: number;
    riskModel: string;
  };
  onStrategyChange: (updates: any) => void;
}

const RiskManagementSettings: React.FC<RiskManagementSettingsProps> = ({ strategy, onStrategyChange }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Risk Management</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="initialBalance" className="text-slate-300">Initial Balance ($)</Label>
          <Input
            id="initialBalance"
            type="number"
            value={strategy.initialBalance}
            onChange={(e) => onStrategyChange({initialBalance: Number(e.target.value)})}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
        <div>
          <Label htmlFor="riskModel" className="text-slate-300">Risk Model</Label>
          <Select value={strategy.riskModel} onValueChange={(value) => onStrategyChange({riskModel: value})}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="fixed">Fixed Risk per Trade</SelectItem>
              <SelectItem value="percentage">Percentage of Equity</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="riskPerTrade" className="text-slate-300">
            {strategy.riskModel === 'fixed' ? 'Risk per Trade (%)' : 'Risk per Trade (% of Equity)'}
          </Label>
          <Input
            id="riskPerTrade"
            type="number"
            step="0.1"
            value={strategy.riskPerTrade}
            onChange={(e) => onStrategyChange({riskPerTrade: Number(e.target.value)})}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
        <div>
          <Label htmlFor="stopLoss" className="text-slate-300">Stop Loss (pips)</Label>
          <Input
            id="stopLoss"
            type="number"
            value={strategy.stopLoss}
            onChange={(e) => onStrategyChange({stopLoss: Number(e.target.value)})}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
        <div>
          <Label htmlFor="takeProfit" className="text-slate-300">Take Profit (pips)</Label>
          <Input
            id="takeProfit"
            type="number"
            value={strategy.takeProfit}
            onChange={(e) => onStrategyChange({takeProfit: Number(e.target.value)})}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
        <div>
          <Label htmlFor="maxPositionSize" className="text-slate-300">Max Position Size (Units)</Label>
          <Input
            id="maxPositionSize"
            type="number"
            value={strategy.maxPositionSize}
            onChange={(e) => onStrategyChange({maxPositionSize: Number(e.target.value)})}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default RiskManagementSettings;
