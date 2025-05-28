
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Save, Play, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StrategyConfigurationTabProps {
  strategy: {
    name: string;
    symbol: string;
    timeframe: string;
    code: string;
    initialBalance: number;
    riskPerTrade: number;
    stopLoss: number;
    takeProfit: number;
    spread: number;
    commission: number;
    slippage: number;
    maxPositionSize: number;
    riskModel: string;
  };
  onStrategyChange: (updates: any) => void;
  onRunBacktest?: () => void;
  isRunning?: boolean;
}

const StrategyConfigurationTab: React.FC<StrategyConfigurationTabProps> = ({ 
  strategy, 
  onStrategyChange,
  onRunBacktest,
  isRunning = false 
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [codeChanged, setCodeChanged] = React.useState(false);

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

  React.useEffect(() => {
    setCodeChanged(false);
  }, [strategy.code]);

  const handleCodeChange = (newCode: string) => {
    onStrategyChange({code: newCode});
    setCodeChanged(true);
  };

  const handleSaveStrategy = async () => {
    if (!strategy.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a strategy name",
        variant: "destructive",
      });
      return;
    }

    if (!strategy.code.trim()) {
      toast({
        title: "Code Required", 
        description: "Please enter strategy code",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from('strategy_results')
        .insert([{
          strategy_name: strategy.name,
          strategy_code: strategy.code,
          symbol: strategy.symbol,
          timeframe: strategy.timeframe,
          win_rate: 0,
          total_return: 0,
          total_trades: 0,
          profit_factor: 0,
          max_drawdown: 0
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Strategy Saved",
        description: `"${strategy.name}" has been saved successfully`,
      });

      setCodeChanged(false);

    } catch (error) {
      console.error('Save strategy error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save strategy",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
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

      <Separator className="bg-slate-600" />

      {/* Risk Management */}
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

      <Separator className="bg-slate-600" />

      {/* Execution Settings */}
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

      <Separator className="bg-slate-600" />

      {/* Python Code */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Python Strategy Code</h3>
        <div>
          <Label htmlFor="strategyCode" className="text-slate-300">Strategy Code</Label>
          <Textarea
            id="strategyCode"
            value={strategy.code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white font-mono text-sm min-h-[300px] mt-2"
            placeholder="def strategy_logic(data):&#10;    # Your strategy logic here&#10;    return {'entry': [], 'exit': []}"
          />
          {codeChanged && (
            <p className="text-orange-400 text-xs mt-1 flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Code modified - run backtest to see changes
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {onRunBacktest && (
          <Button
            onClick={onRunBacktest}
            disabled={isRunning || !strategy.code.trim()}
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
                {codeChanged ? 'Run Backtest (Code Changed)' : 'Run Backtest'}
              </>
            )}
          </Button>
        )}

        <Button
          onClick={handleSaveStrategy}
          disabled={isSaving}
          variant="outline"
          className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          {isSaving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Strategy
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StrategyConfigurationTab;
