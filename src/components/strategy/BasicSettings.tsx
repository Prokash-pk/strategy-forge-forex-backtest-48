
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BasicSettingsProps {
  strategy: {
    name: string;
    symbol: string;
    timeframe: string;
  };
  onStrategyChange: (updates: any) => void;
}

const BasicSettings: React.FC<BasicSettingsProps> = ({ strategy, onStrategyChange }) => {
  const symbols = [
    { value: 'EURUSD=X', label: 'EUR/USD' },
    { value: 'GBPUSD=X', label: 'GBP/USD' },
    { value: 'USDJPY=X', label: 'USD/JPY' },
    { value: 'AUDUSD=X', label: 'AUD/USD' },
    { value: 'USDCAD=X', label: 'USD/CAD' },
    { value: 'USDCHF=X', label: 'USD/CHF' },
    { value: 'NZDUSD=X', label: 'NZD/USD' },
    { value: 'EURGBP=X', label: 'EUR/GBP' },
  ];

  const timeframes = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '1d', label: '1 Day' },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Basic Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="strategyName" className="text-slate-300">Strategy Name</Label>
          <Input
            id="strategyName"
            value={strategy.name}
            onChange={(e) => onStrategyChange({name: e.target.value})}
            className="bg-slate-700 border-slate-600 text-white"
            placeholder="My Trading Strategy"
          />
        </div>
        <div>
          <Label htmlFor="symbol" className="text-slate-300">Currency Pair</Label>
          <Select value={strategy.symbol} onValueChange={(value) => onStrategyChange({symbol: value})}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {symbols.map((symbol) => (
                <SelectItem key={symbol.value} value={symbol.value} className="text-white">
                  {symbol.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="timeframe" className="text-slate-300">Timeframe</Label>
          <Select value={strategy.timeframe} onValueChange={(value) => onStrategyChange({timeframe: value})}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {timeframes.map((tf) => (
                <SelectItem key={tf.value} value={tf.value} className="text-white">
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default BasicSettings;
