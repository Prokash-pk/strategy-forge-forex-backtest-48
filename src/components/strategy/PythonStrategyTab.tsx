import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Save, Play, RefreshCw, AlertTriangle, ChevronDown, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PROVEN_STRATEGIES } from '@/services/analytics/provenStrategies';

interface PythonStrategyTabProps {
  strategy: {
    name: string;
    symbol: string;
    timeframe: string;
    code: string;
  };
  onStrategyChange: (updates: any) => void;
  onRunBacktest?: () => void;
  isRunning?: boolean;
  backtestResults?: any;
}

const PythonStrategyTab: React.FC<PythonStrategyTabProps> = ({ 
  strategy, 
  onStrategyChange, 
  onRunBacktest,
  isRunning = false,
  backtestResults 
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [codeChanged, setCodeChanged] = React.useState(false);

  // Check if last backtest resulted in 0 trades
  const hasZeroTrades = backtestResults && backtestResults.totalTrades === 0;

  // Watch for external code changes (from Quick Add)
  React.useEffect(() => {
    setCodeChanged(false);
  }, [strategy.code]);

  const handleCodeChange = (newCode: string) => {
    onStrategyChange({code: newCode});
    setCodeChanged(true);
  };

  const handleQuickLoadStrategy = (provenStrategy: any) => {
    onStrategyChange({
      name: provenStrategy.strategy_name,
      code: provenStrategy.strategy_code,
      symbol: provenStrategy.symbol,
      timeframe: provenStrategy.timeframe
    });
    setCodeChanged(true);
    
    toast({
      title: "Strategy Loaded",
      description: `Loaded "${provenStrategy.strategy_name}" with ${provenStrategy.win_rate}% win rate`,
    });
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

  const handleLoadImprovedStrategy = () => {
    const improvedCode = `# Improved Order Flow Imbalance Strategy
# More practical version that should generate trades

def strategy_logic(data):
    close = data['Close'].tolist()
    volume = data['Volume'].tolist()
    
    entry = []
    exit = []
    imbalance = []
    momentum_strength = []

    for i in range(len(data)):
        if i < 20:  # Need enough history for calculations
            entry.append(False)
            exit.append(False)
            imbalance.append(0)
            momentum_strength.append(0)
        else:
            # Calculate price momentum over multiple periods
            short_momentum = close[i] - close[i - 3]  # 3-bar momentum
            medium_momentum = close[i] - close[i - 10]  # 10-bar momentum
            
            # Use price range as volume proxy for forex (high-low spread indicates activity)
            high = data['High'].tolist()[i] if 'High' in data else close[i]
            low = data['Low'].tolist()[i] if 'Low' in data else close[i]
            price_range = high - low
            avg_range = sum([data['High'].tolist()[j] - data['Low'].tolist()[j] for j in range(i-10, i)]) / 10 if 'High' in data else 0.001
            
            # Volume proxy: use price range relative to average range
            volume_proxy = price_range / max(avg_range, 0.0001)
            
            # Simulate imbalance using momentum and volume proxy
            imbal = short_momentum * volume_proxy * 1000000  # Scale for forex
            imbalance.append(imbal)
            
            # Calculate momentum strength
            momentum_str = abs(short_momentum) + abs(medium_momentum)
            momentum_strength.append(momentum_str)
            
            # Support/Resistance levels using SMA
            sma_20 = sum(close[i-20:i]) / 20
            sma_10 = sum(close[i-10:i]) / 10
            
            # More practical entry conditions
            bullish_momentum = short_momentum > 0 and medium_momentum > 0
            above_support = close[i] > sma_20
            volume_spike = volume_proxy > 1.5  # Above average activity
            
            # Entry: bullish momentum + above support + volume spike
            entry_signal = bullish_momentum and above_support and volume_spike
            
            # Exit conditions
            bearish_momentum = short_momentum < 0 and close[i] < sma_10
            momentum_weakening = momentum_str < momentum_strength[i-5] if i >= 25 else False
            
            exit_signal = bearish_momentum or momentum_weakening
            
            entry.append(entry_signal)
            exit.append(exit_signal)

    return {
        'entry': entry,
        'exit': exit,
        'imbalance': imbalance,
        'momentum_strength': momentum_strength
    }`;

    onStrategyChange({code: improvedCode});
    setCodeChanged(true);
    
    toast({
      title: "Strategy Updated",
      description: "Loaded improved version that should generate more trades",
    });
  };

  return (
    <div className="space-y-4 mt-6">
      {/* Zero Trades Alert */}
      {hasZeroTrades && (
        <Alert className="border-orange-600 bg-orange-600/10">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          <AlertDescription className="text-orange-300">
            <strong>No trades generated!</strong> Your strategy might have too restrictive conditions. 
            Try loading a proven strategy below or adjust your entry/exit criteria.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <Label htmlFor="strategyCode" className="text-slate-300">Python Strategy Code</Label>
        <div className="flex gap-2">
          {/* Quick Load Proven Strategies Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
              >
                <Zap className="h-4 w-4 mr-2" />
                Quick Load
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 bg-slate-800 border-slate-600">
              {PROVEN_STRATEGIES.map((strategy) => (
                <DropdownMenuItem
                  key={strategy.id}
                  onClick={() => handleQuickLoadStrategy(strategy)}
                  className="cursor-pointer hover:bg-slate-700 p-3"
                >
                  <div className="flex flex-col w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">{strategy.strategy_name}</span>
                      <span className="text-emerald-400 text-sm font-bold">{strategy.win_rate}%</span>
                    </div>
                    <div className="text-xs text-slate-400 mb-1">
                      {strategy.symbol} • {strategy.timeframe} • {strategy.total_trades} trades
                    </div>
                    <div className="text-xs text-slate-300">
                      Monthly Return: {strategy.monthly_return}%
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleLoadImprovedStrategy}
            variant="outline"
            size="sm"
            className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
          >
            {hasZeroTrades ? 'Fix Zero Trades Issue' : 'Load Improved Version'}
          </Button>
        </div>
      </div>
      
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

export default PythonStrategyTab;
