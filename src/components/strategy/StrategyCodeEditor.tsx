
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
    const cleanCode = `# Smart Momentum Strategy with OANDA Trade Direction Support
# Enhanced with proper BUY/SELL signals and direction array for OANDA integration

def strategy_logic(data, reverse_signals=False):
    """
    Enhanced momentum strategy with OANDA-compatible trade directions:
    - EMA trend filtering
    - RSI momentum confirmation
    - Volatility-based entry timing
    - EXPLICIT BUY/SELL direction array for OANDA execution
    - Reverse signal capability for testing both directions
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
    direction = []  # CRITICAL: Trade direction for OANDA integration
    
    for i in range(len(close)):
        if i < 200:
            entry.append(False)
            exit.append(False)
            direction.append(None)
        else:
            # Trend conditions
            uptrend = ema_fast[i] > ema_slow[i] and close[i] > ema_trend[i]
            downtrend = ema_fast[i] < ema_slow[i] and close[i] < ema_trend[i]
            
            # Momentum conditions
            momentum_up = close[i] > ema_fast[i] and rsi[i] > 50 and rsi[i] < 75
            momentum_down = close[i] < ema_fast[i] and rsi[i] < 50 and rsi[i] > 25
            
            # Volatility filter
            high_vol = atr[i] > atr_avg[i] * 1.2
            
            # Base entry conditions
            base_long_entry = uptrend and momentum_up and high_vol
            base_short_entry = downtrend and momentum_down and high_vol
            
            # Apply reverse signals if enabled (for testing opposite direction)
            if reverse_signals:
                actual_long = base_short_entry
                actual_short = base_long_entry
            else:
                actual_long = base_long_entry
                actual_short = base_short_entry
            
            # Generate entry signals with EXPLICIT directions for OANDA
            if actual_long:
                entry.append(True)
                direction.append("BUY")  # OANDA-compatible BUY signal
            elif actual_short:
                entry.append(True)
                direction.append("SELL")  # OANDA-compatible SELL signal
            else:
                entry.append(False)
                direction.append(None)  # No trade signal
            
            # Exit conditions
            exit_signal = rsi[i] > 80 or rsi[i] < 20 or not high_vol
            exit.append(exit_signal)
    
    # CRITICAL: Return direction array for OANDA integration
    return {
        'entry': entry,
        'exit': exit,
        'direction': direction,  # Required for OANDA trade execution
        'ema_fast': ema_fast,
        'ema_slow': ema_slow,
        'ema_trend': ema_trend,
        'rsi': rsi,
        'atr': atr,
        'reverse_signals_applied': reverse_signals,
        'note': 'Strategy with OANDA-compatible trade directions for live trading'
    }`;

    onCodeChange(cleanCode);
    toast({
      title: "Strategy Updated! ✅",
      description: "Loaded strategy with OANDA-compatible trade directions (BUY/SELL signals)",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={copyToClipboard}
            className="bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Code
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadCleanStrategy}
            className="bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Load OANDA-Compatible Strategy
          </Button>
        </div>
        {codeChanged && (
          <span className="text-sm text-amber-400">• Unsaved changes</span>
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
