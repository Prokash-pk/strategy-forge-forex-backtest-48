
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface BasicSettingsProps {
  strategy: {
    name: string;
    symbol: string;
    timeframe: string;
    reverseSignals?: boolean;
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

      {/* Reverse Signals Option */}
      <div className="flex items-center justify-between p-4 border border-slate-600 rounded-lg bg-slate-800/50">
        <div className="space-y-1">
          <Label htmlFor="reverse-signals" className="text-sm font-medium text-white">
            Reverse Strategy Signals
          </Label>
          <p className="text-xs text-slate-400">
            Flip all BUY signals to SELL and SELL signals to BUY to test opposite strategy performance
          </p>
        </div>
        <Switch
          id="reverse-signals"
          checked={strategy.reverseSignals || false}
          onCheckedChange={(checked) => onStrategyChange({ reverseSignals: checked })}
        />
      </div>

      {strategy.reverseSignals && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            ⚠️ <strong>Reverse Mode Active:</strong> All strategy signals will be inverted. 
            This will turn your current strategy into its opposite for testing purposes.
          </p>
        </div>
      )}
    </div>
  );
};

export default BasicSettings;
