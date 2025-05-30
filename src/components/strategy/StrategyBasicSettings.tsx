
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface StrategyBasicSettingsProps {
  strategy: any;
  onStrategyChange: (updates: any) => void;
}

const StrategyBasicSettings: React.FC<StrategyBasicSettingsProps> = ({
  strategy,
  onStrategyChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Strategy Settings</CardTitle>
        <CardDescription>Configure your strategy parameters and market selection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="strategy-name">Strategy Name</Label>
            <Input
              id="strategy-name"
              value={strategy.name}
              onChange={(e) => onStrategyChange({ name: e.target.value })}
              placeholder="Enter strategy name"
            />
          </div>
          
          <div>
            <Label htmlFor="symbol">Trading Symbol</Label>
            <Select value={strategy.symbol} onValueChange={(value) => onStrategyChange({ symbol: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select symbol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EURUSD=X">EUR/USD</SelectItem>
                <SelectItem value="GBPUSD=X">GBP/USD</SelectItem>
                <SelectItem value="USDJPY=X">USD/JPY</SelectItem>
                <SelectItem value="AUDUSD=X">AUD/USD</SelectItem>
                <SelectItem value="USDCAD=X">USD/CAD</SelectItem>
                <SelectItem value="USDCHF=X">USD/CHF</SelectItem>
                <SelectItem value="NZDUSD=X">NZD/USD</SelectItem>
                <SelectItem value="EURGBP=X">EUR/GBP</SelectItem>
                <SelectItem value="EURJPY=X">EUR/JPY</SelectItem>
                <SelectItem value="GBPJPY=X">GBP/JPY</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timeframe">Timeframe</Label>
            <Select value={strategy.timeframe} onValueChange={(value) => onStrategyChange({ timeframe: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 Minute</SelectItem>
                <SelectItem value="5m">5 Minutes</SelectItem>
                <SelectItem value="15m">15 Minutes</SelectItem>
                <SelectItem value="30m">30 Minutes</SelectItem>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="4h">4 Hours</SelectItem>
                <SelectItem value="1d">1 Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="initial-balance">Initial Balance ($)</Label>
            <Input
              id="initial-balance"
              type="number"
              value={strategy.initialBalance}
              onChange={(e) => onStrategyChange({ initialBalance: parseFloat(e.target.value) || 0 })}
              placeholder="10000"
            />
          </div>
        </div>

        {/* New Reverse Signals Option */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="space-y-1">
            <Label htmlFor="reverse-signals" className="text-sm font-medium">
              Reverse Strategy Signals
            </Label>
            <p className="text-xs text-muted-foreground">
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
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              ⚠️ <strong>Reverse Mode Active:</strong> All strategy signals will be inverted. 
              This will turn your current strategy into its opposite for testing purposes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StrategyBasicSettings;
