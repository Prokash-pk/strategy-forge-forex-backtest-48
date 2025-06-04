
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StrategyCodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  codeChanged: boolean;
}

const StrategyCodeEditor: React.FC<StrategyCodeEditorProps> = ({
  code,
  onCodeChange,
  codeChanged
}) => {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied",
      description: "Strategy code copied to clipboard",
    });
  };

  const loadCleanStrategy = () => {
    const cleanCode = `# Clean Smart Momentum Strategy
# Simple and effective momentum trading with proper directional signals

def strategy_logic(data, reverse_signals=False):
    """
    Clean momentum strategy with directional signals:
    - EMA trend filtering
    - RSI momentum confirmation
    - Volatility-based entry timing
    - Proper BUY/SELL signal generation
    """
    
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    
    # Technical indicators
    ema_fast = TechnicalAnalysis.ema(close, 21)
    ema_slow = TechnicalAnalysis.ema(close, 55)
    ema_trend = TechnicalAnalysis.ema(close, 200)
    rsi = TechnicalAnalysis.rsi(close, 14)
    atr = TechnicalAnalysis.atr(high, low, close, 14)
    atr_avg = TechnicalAnalysis.sma(atr, 20)
    
    entry = []
    exit = []
    trade_direction = []
    
    for i in range(len(close)):
        if i < 200:
            entry.append(False)
            exit.append(False)
            trade_direction.append('NONE')
        else:
            # Trend conditions
            uptrend = ema_fast[i] > ema_slow[i] and close[i] > ema_trend[i]
            downtrend = ema_fast[i] < ema_slow[i] and close[i] < ema_trend[i]
            
            # Momentum conditions
            momentum_up = close[i] > ema_fast[i] and rsi[i] > 50 and rsi[i] < 75
            momentum_down = close[i] < ema_fast[i] and rsi[i] < 50 and rsi[i] > 25
            
            # Volatility filter
            high_vol = atr[i] > atr_avg[i] * 1.2
            
            # Entry conditions
            long_signal = uptrend and momentum_up and high_vol
            short_signal = downtrend and momentum_down and high_vol
            
            # Apply reverse signals if enabled
            if reverse_signals:
                actual_long = short_signal
                actual_short = long_signal
            else:
                actual_long = long_signal
                actual_short = short_signal
            
            # Generate signals
            if actual_long:
                entry.append(True)
                trade_direction.append('BUY')
            elif actual_short:
                entry.append(True)
                trade_direction.append('SELL')
            else:
                entry.append(False)
                trade_direction.append('NONE')
            
            # Exit conditions
            exit_signal = rsi[i] > 80 or rsi[i] < 20 or not high_vol
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'trade_direction': trade_direction,
        'ema_fast': ema_fast,
        'ema_slow': ema_slow,
        'ema_trend': ema_trend,
        'rsi': rsi,
        'atr': atr,
        'reverse_signals_applied': reverse_signals
    }`;

    onCodeChange(cleanCode);
    toast({
      title: "Clean Strategy Loaded",
      description: "Loaded a cleaner, more readable version of the momentum strategy",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Code
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadCleanStrategy}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Load Clean Strategy
          </Button>
        </div>
        {codeChanged && (
          <span className="text-sm text-amber-500">• Unsaved changes</span>
        )}
      </div>
      
      <Textarea
        id="strategyCode"
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        className="min-h-[400px] font-mono text-sm bg-slate-800 text-slate-100 border-slate-600"
        placeholder="Enter your Python strategy code here..."
      />
    </div>
  );
};

export default StrategyCodeEditor;
