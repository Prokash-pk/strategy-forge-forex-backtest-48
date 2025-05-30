
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, TrendingUp } from 'lucide-react';

interface RiskManagementSettingsProps {
  strategy: {
    initialBalance: number;
    riskPerTrade: number;
    stopLoss: number;
    takeProfit: number;
    maxPositionSize: number;
    riskModel: string;
    positionSizingMode: string;
    riskRewardRatio: number;
  };
  onStrategyChange: (updates: any) => void;
}

const RiskManagementSettings: React.FC<RiskManagementSettingsProps> = ({ strategy, onStrategyChange }) => {
  const calculatePositionSize = () => {
    const riskAmount = (strategy.initialBalance * strategy.riskPerTrade) / 100;
    const stopLossDistance = strategy.stopLoss * 0.0001; // Convert pips to price
    const positionSize = riskAmount / stopLossDistance;
    return Math.round(positionSize);
  };

  const calculateTakeProfit = () => {
    if (strategy.positionSizingMode === 'ratio') {
      return Math.round(strategy.stopLoss * strategy.riskRewardRatio);
    }
    return strategy.takeProfit;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5" />
            Risk Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="riskPerTrade" className="text-slate-300">Risk per Trade (%)</Label>
              <Input
                id="riskPerTrade"
                type="number"
                step="0.1"
                value={strategy.riskPerTrade}
                onChange={(e) => onStrategyChange({riskPerTrade: Number(e.target.value)})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="positionSizingMode" className="text-slate-300">Position Sizing Mode</Label>
            <Select 
              value={strategy.positionSizingMode || 'manual'} 
              onValueChange={(value) => onStrategyChange({positionSizingMode: value})}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="manual">Manual Stop/Take Profit Levels</SelectItem>
                <SelectItem value="ratio">Fixed Risk-Reward Ratio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {strategy.positionSizingMode === 'ratio' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="riskRewardRatio" className="text-slate-300">Risk-Reward Ratio (1:X)</Label>
                <Input
                  id="riskRewardRatio"
                  type="number"
                  step="0.1"
                  value={strategy.riskRewardRatio || 1.5}
                  onChange={(e) => onStrategyChange({
                    riskRewardRatio: Number(e.target.value),
                    takeProfit: Math.round(strategy.stopLoss * Number(e.target.value))
                  })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          )}

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
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5" />
            Position Size Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-slate-300">
            <p><strong>Risk Amount:</strong> ${((strategy.initialBalance * strategy.riskPerTrade) / 100).toFixed(2)}</p>
            <p><strong>Calculated Position Size:</strong> {calculatePositionSize().toLocaleString()} units ({(calculatePositionSize() / 100000).toFixed(2)} lots)</p>
            <p><strong>Stop Loss:</strong> {strategy.stopLoss} pips</p>
            <p><strong>Take Profit:</strong> {calculateTakeProfit()} pips</p>
            <p><strong>Risk-Reward Ratio:</strong> 1:{(calculateTakeProfit() / strategy.stopLoss).toFixed(1)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskManagementSettings;
