
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Code, Database } from 'lucide-react';
import StrategyFileUpload from './StrategyFileUpload';

interface StrategyConfigurationProps {
  strategy: {
    name: string;
    symbol: string;
    timeframe: string;
    code: string;
  };
  onStrategyChange: (updates: any) => void;
}

const timeframes = [
  { value: '1m', label: '1 Minute', period: '7 days', dataPoints: 10080 },
  { value: '5m', label: '5 Minutes', period: '60 days', dataPoints: 17280 },
  { value: '15m', label: '15 Minutes', period: '60 days', dataPoints: 5760 },
  { value: '1h', label: '1 Hour', period: '730 days', dataPoints: 17520 },
  { value: '1d', label: '1 Day', period: '5 years', dataPoints: 1825 }
];

const symbols = [
  'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'USDCAD=X',
  'USDCHF=X', 'NZDUSD=X', 'EURGBP=X', 'EURJPY=X', 'GBPJPY=X'
];

const StrategyConfiguration: React.FC<StrategyConfigurationProps> = ({ strategy, onStrategyChange }) => {
  const selectedTimeframe = timeframes.find(tf => tf.value === strategy.timeframe);

  const handleStrategyLoaded = (code: string, name: string) => {
    onStrategyChange({ code, name });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Code className="h-5 w-5" />
            Strategy Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="strategyName" className="text-slate-300">Strategy Name</Label>
              <Input
                id="strategyName"
                value={strategy.name}
                onChange={(e) => onStrategyChange({name: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="symbol" className="text-slate-300">Currency Pair</Label>
              <Select value={strategy.symbol} onValueChange={(value) => onStrategyChange({symbol: value})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {symbols.map(symbol => (
                    <SelectItem key={symbol} value={symbol} className="text-white">
                      {symbol.replace('=X', '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="timeframe" className="text-slate-300">Timeframe</Label>
              <Select value={strategy.timeframe} onValueChange={(value) => onStrategyChange({timeframe: value})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {timeframes.map(tf => (
                    <SelectItem key={tf.value} value={tf.value} className="text-white">
                      <div className="flex justify-between items-center w-full">
                        <span>{tf.label}</span>
                        <span className="text-xs text-slate-400 ml-4">({tf.period})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTimeframe && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-emerald-500/10 rounded-lg">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400">
                    Will fetch real {selectedTimeframe.period} data from Twelve Data API
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-slate-600" />

          <div>
            <Label htmlFor="code" className="text-slate-300">Strategy Code (Python)</Label>
            <Textarea
              id="code"
              value={strategy.code}
              onChange={(e) => onStrategyChange({code: e.target.value})}
              className="bg-slate-700 border-slate-600 text-white font-mono h-64 resize-none"
              placeholder="Enter your strategy logic here..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Strategy File Upload */}
      <StrategyFileUpload onStrategyLoaded={handleStrategyLoaded} />
    </div>
  );
};

export default StrategyConfiguration;
