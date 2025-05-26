
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

interface RiskManagementProps {
  strategy: {
    initialBalance: number;
    riskPerTrade: number;
    stopLoss: number;
    takeProfit: number;
  };
  onStrategyChange: (updates: any) => void;
}

const RiskManagement: React.FC<RiskManagementProps> = ({ strategy, onStrategyChange }) => {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <DollarSign className="h-5 w-5" />
          Risk Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <Label htmlFor="riskPerTrade" className="text-slate-300">Risk Per Trade (%)</Label>
          <Input
            id="riskPerTrade"
            type="number"
            step="0.1"
            value={strategy.riskPerTrade}
            onChange={(e) => onStrategyChange({riskPerTrade: Number(e.target.value)})}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskManagement;
