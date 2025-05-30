
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, Target } from 'lucide-react';

interface WilliamsFractalStrategyProps {
  onLoadStrategy: (strategy: any) => void;
}

const WilliamsFractalStrategy: React.FC<WilliamsFractalStrategyProps> = ({ onLoadStrategy }) => {
  const strategyCode = `# Williams Fractal + Triple EMA Scalper Strategy
# Optimized for 1-minute timeframe but works on all timeframes

def strategy_logic(data):
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    
    # Calculate Triple EMAs
    ema_20 = TechnicalAnalysis.ema(close, 20)
    ema_50 = TechnicalAnalysis.ema(close, 50)
    ema_100 = TechnicalAnalysis.ema(close, 100)
    
    # Williams Fractals implementation
    def detect_fractals(highs, lows, period=2):
        fractal_high = []
        fractal_low = []
        
        for i in range(len(highs)):
            if i < period or i >= len(highs) - period:
                fractal_high.append(False)
                fractal_low.append(False)
                continue
            
            # Fractal High (resistance)
            is_fractal_high = True
            for j in range(i - period, i + period + 1):
                if j != i and highs[j] >= highs[i]:
                    is_fractal_high = False
                    break
            
            # Fractal Low (support)
            is_fractal_low = True
            for j in range(i - period, i + period + 1):
                if j != i and lows[j] <= lows[i]:
                    is_fractal_low = False
                    break
                    
            fractal_high.append(is_fractal_high)
            fractal_low.append(is_fractal_low)
        
        return fractal_high, fractal_low
    
    fractal_highs, fractal_lows = detect_fractals(high, low, 2)
    
    entry = []
    exit = []
    pullback_type = []
    
    for i in range(len(data)):
        if i < 105:  # Need enough data for EMA 100 + fractal lookback
            entry.append(False)
            exit.append(False)
            pullback_type.append(0)
            continue
        
        current_price = close[i]
        current_ema_20 = ema_20[i]
        current_ema_50 = ema_50[i]
        current_ema_100 = ema_100[i]
        
        # Check EMA alignment for LONG (EMA 20 > EMA 50 > EMA 100)
        long_ema_order = (current_ema_20 > current_ema_50 and 
                         current_ema_50 > current_ema_100)
        
        # Check EMA alignment for SHORT (EMA 100 > EMA 50 > EMA 20)
        short_ema_order = (current_ema_100 > current_ema_50 and 
                          current_ema_50 > current_ema_20)
        
        # LONG Entry Logic
        long_entry = False
        if long_ema_order and current_price > current_ema_100:
            # Check for pullback conditions
            pullback_below_20 = current_price < current_ema_20
            pullback_below_50 = current_price < current_ema_50
            
            # Look for recent fractal low signal (within last 3 bars)
            recent_fractal_low = any(fractal_lows[max(0, i-3):i+1])
            
            if (pullback_below_20 or pullback_below_50) and recent_fractal_low:
                long_entry = True
                if pullback_below_50:
                    pullback_type.append(2)  # Deeper pullback
                else:
                    pullback_type.append(1)  # Shallow pullback
        
        # SHORT Entry Logic
        short_entry = False
        if short_ema_order and current_price < current_ema_100:
            # Check for pullback above EMA 20
            pullback_above_20 = current_price > current_ema_20
            
            # Look for recent fractal high signal
            recent_fractal_high = any(fractal_highs[max(0, i-3):i+1])
            
            if pullback_above_20 and recent_fractal_high:
                short_entry = True
                pullback_type.append(-1)  # Short signal
        
        # Final entry decision
        entry_signal = long_entry or short_entry
        if not entry_signal:
            pullback_type.append(0)
        
        # Exit conditions - EMA order breakdown or price beyond EMA 100
        exit_signal = False
        if i > 0:
            # Exit if EMA alignment breaks or price violates EMA 100 rule
            ema_breakdown = not (long_ema_order or short_ema_order)
            price_violation = (long_ema_order and current_price < current_ema_100) or \
                            (short_ema_order and current_price > current_ema_100)
            exit_signal = ema_breakdown or price_violation
        
        entry.append(entry_signal)
        exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'ema_20': ema_20,
        'ema_50': ema_50,
        'ema_100': ema_100,
        'fractal_highs': fractal_highs,
        'fractal_lows': fractal_lows,
        'pullback_type': pullback_type
    }`;

  const handleLoadStrategy = () => {
    onLoadStrategy({
      name: 'Williams Fractal + Triple EMA Scalper',
      code: strategyCode,
      timeframe: '1m',
      stopLoss: 30,  // Will be dynamically calculated
      takeProfit: 45, // 1.5x risk
      riskPerTrade: 2,
      riskModel: 'dynamic'
    });
  };

  return (
    <Card className="bg-slate-700 border-slate-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5 text-green-400" />
          Williams Fractal + Triple EMA Scalper
        </CardTitle>
        <p className="text-slate-400 text-sm">
          Advanced scalping strategy using Williams Fractals and Triple EMA alignment
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 p-3 rounded border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-400" />
              <span className="text-green-400 font-medium text-sm">LONG Setup</span>
            </div>
            <ul className="text-slate-300 text-xs space-y-1">
              <li>• EMA 20 {' > '} EMA 50 {' > '} EMA 100</li>
              <li>• Price pullback below EMA 20/50</li>
              <li>• Williams Fractal low signal</li>
              <li>• Stop: Below EMA 50/100</li>
            </ul>
          </div>
          
          <div className="bg-slate-800 p-3 rounded border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-red-400" />
              <span className="text-red-400 font-medium text-sm">SHORT Setup</span>
            </div>
            <ul className="text-slate-300 text-xs space-y-1">
              <li>• EMA 100 {' > '} EMA 50 {' > '} EMA 20</li>
              <li>• Price pullback above EMA 20</li>
              <li>• Williams Fractal high signal</li>
              <li>• Stop: Above EMA 50</li>
            </ul>
          </div>
          
          <div className="bg-slate-800 p-3 rounded border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium text-sm">Risk Rules</span>
            </div>
            <ul className="text-slate-300 text-xs space-y-1">
              <li>• 1.5x Risk-Reward Ratio</li>
              <li>• Dynamic stop placement</li>
              <li>• No entry if EMA crossing</li>
              <li>• Price must respect EMA 100</li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-800 p-3 rounded border border-slate-600">
          <h4 className="text-white text-sm font-medium mb-2">Strategy Features:</h4>
          <div className="grid grid-cols-2 gap-2 text-slate-400 text-xs">
            <div>✓ Williams Fractal detection (period=2)</div>
            <div>✓ Triple EMA alignment filter</div>
            <div>✓ Dynamic pullback analysis</div>
            <div>✓ Risk-based position sizing</div>
            <div>✓ Trend invalidation exits</div>
            <div>✓ 1:1.5 Risk-Reward targeting</div>
          </div>
        </div>

        <Button 
          onClick={handleLoadStrategy}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          Load Williams Fractal Strategy
        </Button>
      </CardContent>
    </Card>
  );
};

export default WilliamsFractalStrategy;
