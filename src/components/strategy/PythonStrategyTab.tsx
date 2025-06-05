import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import StrategyZeroTradesAlert from './StrategyZeroTradesAlert';
import StrategyQuickLoad from './StrategyQuickLoad';
import StrategyCodeEditor from './StrategyCodeEditor';
import StrategyActionButtons from './StrategyActionButtons';
import StrategyValidationAlert from './StrategyValidationAlert';
import { useStrategyValidation } from '@/hooks/useStrategyValidation';
import { FileText } from 'lucide-react';

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
  
  // Add strategy validation
  const { validation, isValidating, getTemplate } = useStrategyValidation(strategy.code);

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

  const handleStrategyLoad = (loadedStrategy: any) => {
    onStrategyChange(loadedStrategy);
    setCodeChanged(true);
  };

  const handleLoadTemplate = () => {
    const template = getTemplate();
    handleCodeChange(template);
    
    toast({
      title: "Template Loaded",
      description: "Loaded template with required directional signals structure",
    });
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

  const handleSaveSettings = async () => {
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Save complete strategy configuration
      const strategySettings = {
        strategy_name: strategy.name,
        strategy_code: strategy.code,
        symbol: strategy.symbol,
        timeframe: strategy.timeframe,
        user_id: user.id,
        win_rate: 0,
        total_return: 0,
        total_trades: 0,
        profit_factor: 0,
        max_drawdown: 0
      };

      const { data, error } = await supabase
        .from('strategy_results')
        .insert(strategySettings)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Settings Saved",
        description: `Complete strategy configuration for "${strategy.name}" has been saved successfully`,
      });

      setCodeChanged(false);

    } catch (error) {
      console.error('Save settings error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save strategy settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <StrategyZeroTradesAlert show={hasZeroTrades} />

      {/* Strategy Validation */}
      <StrategyValidationAlert validation={validation} />

      <div className="flex justify-between items-center">
        <Label htmlFor="strategyCode" className="text-slate-300">Python Strategy Code</Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadTemplate}
            className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
          >
            <FileText className="h-4 w-4 mr-1" />
            Load Template
          </Button>
          <StrategyQuickLoad
            onStrategyLoad={handleStrategyLoad}
            onImprovedLoad={handleLoadImprovedStrategy}
            hasZeroTrades={hasZeroTrades}
          />
        </div>
      </div>
      
      <StrategyCodeEditor
        code={strategy.code}
        onCodeChange={handleCodeChange}
        codeChanged={codeChanged}
      />

      <StrategyActionButtons
        onRunBacktest={onRunBacktest}
        onSaveSettings={handleSaveSettings}
        isRunning={isRunning}
        isSaving={isSaving}
        codeChanged={codeChanged}
        hasCode={!!strategy.code.trim()}
        disabled={validation && !validation.isValid}
      />
    </div>
  );
};

export default PythonStrategyTab;
