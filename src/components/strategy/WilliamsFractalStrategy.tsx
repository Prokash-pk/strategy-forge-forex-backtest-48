
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, Target } from 'lucide-react';

interface WilliamsFractalStrategyProps {
  onLoadStrategy: (strategy: any) => void;
}

const WilliamsFractalStrategy: React.FC<WilliamsFractalStrategyProps> = ({ onLoadStrategy }) => {
  const strategyCode = `# Enhanced Williams Fractal + Multi-Indicator Strategy
# Includes RSI, ATR, Stochastic, and Volume analysis

def strategy_logic(data):
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    volume = data['Volume'].tolist()
    
    # Calculate Triple EMAs
    ema_20 = TechnicalAnalysis.ema(close, 20)
    ema_50 = TechnicalAnalysis.ema(close, 50)
    ema_100 = TechnicalAnalysis.ema(close, 100)
    
    # Additional indicators for confirmation
    rsi = TechnicalAnalysis.rsi(close, 14)
    atr = TechnicalAnalysis.atr(high, low, close, 14)
    stoch = TechnicalAnalysis.stochasticOscillator(high, low, close, 14, 3)
    
    # Volume moving average for volume confirmation
    volume_sma = TechnicalAnalysis.sma(volume, 20)
    
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
    signal_strength = []
    
    for i in range(len(data)):
        if i < 105:  # Need enough data for all indicators
            entry.append(False)
            exit.append(False)
            signal_strength.append(0)
            continue
        
        current_price = close[i]
        current_ema_20 = ema_20[i]
        current_ema_50 = ema_50[i]
        current_ema_100 = ema_100[i]
        current_rsi = rsi[i] if not pd.isna(rsi[i]) else 50
        current_atr = atr[i] if not pd.isna(atr[i]) else 0
        current_stoch_k = stoch['k'][i] if not pd.isna(stoch['k'][i]) else 50
        
        # Volume confirmation
        volume_above_avg = volume[i] > volume_sma[i] if not pd.isna(volume_sma[i]) else True
        
        # Check EMA alignment for LONG
        long_ema_order = (current_ema_20 > current_ema_50 and 
                         current_ema_50 > current_ema_100)
        
        # Check EMA alignment for SHORT
        short_ema_order = (current_ema_100 > current_ema_50 and 
                          current_ema_50 > current_ema_20)
        
        # LONG Entry Logic with additional confirmations
        long_entry = False
        strength = 0
        
        if long_ema_order and current_price > current_ema_100:
            # Check for pullback conditions
            pullback_below_20 = current_price < current_ema_20
            pullback_below_50 = current_price < current_ema_50
            
            # Look for recent fractal low signal
            recent_fractal_low = any(fractal_lows[max(0, i-3):i+1])
            
            # Additional confirmations
            rsi_oversold = current_rsi < 40  # RSI confirmation
            stoch_oversold = current_stoch_k < 30  # Stochastic confirmation
            
            if (pullback_below_20 or pullback_below_50) and recent_fractal_low:
                strength += 3  # Base signal
                
                # Add strength based on confirmations
                if rsi_oversold:
                    strength += 2
                if stoch_oversold:
                    strength += 2
                if volume_above_avg:
                    strength += 1
                if current_atr > 0 and abs(current_price - current_ema_20) < current_atr:
                    strength += 1  # Price near EMA with good volatility
                
                # Only enter if we have strong confirmation (strength >= 5)
                if strength >= 5:
                    long_entry = True
        
        # SHORT Entry Logic with additional confirmations
        short_entry = False
        
        if short_ema_order and current_price < current_ema_100:
            # Check for pullback above EMA 20
            pullback_above_20 = current_price > current_ema_20
            
            # Look for recent fractal high signal
            recent_fractal_high = any(fractal_highs[max(0, i-3):i+1])
            
            # Additional confirmations
            rsi_overbought = current_rsi > 60  # RSI confirmation
            stoch_overbought = current_stoch_k > 70  # Stochastic confirmation
            
            if pullback_above_20 and recent_fractal_high:
                strength += 3  # Base signal
                
                # Add strength based on confirmations
                if rsi_overbought:
                    strength += 2
                if stoch_overbought:
                    strength += 2
                if volume_above_avg:
                    strength += 1
                if current_atr > 0 and abs(current_price - current_ema_20) < current_atr:
                    strength += 1
                
                # Only enter if we have strong confirmation
                if strength >= 5:
                    short_entry = True
                    strength = -strength  # Negative for short signals
        
        # Final entry decision
        entry_signal = long_entry or short_entry
        
        # Exit conditions - enhanced with indicator confirmation
        exit_signal = False
        if i > 0:
            # Exit if EMA alignment breaks
            ema_breakdown = not (long_ema_order or short_ema_order)
            
            # Exit if price violates EMA 100 rule
            price_violation = (long_ema_order and current_price < current_ema_100) or \
                            (short_ema_order and current_price > current_ema_100)
            
            # Exit on RSI divergence (simple version)
            rsi_exit = (long_ema_order and current_rsi > 75) or \
                      (short_ema_order and current_rsi < 25)
            
            exit_signal = ema_breakdown or price_violation or rsi_exit
        
        entry.append(entry_signal)
        exit.append(exit_signal)
        signal_strength.append(strength)
    
    return {
        'entry': entry,
        'exit': exit,
        'ema_20': ema_20,
        'ema_50': ema_50,
        'ema_100': ema_100,
        'fractal_highs': fractal_highs,
        'fractal_lows': fractal_lows,
        'rsi': rsi,
        'atr': atr,
        'stoch_k': stoch['k'],
        'stoch_d': stoch['d'],
        'signal_strength': signal_strength,
        'volume_sma': volume_sma
    }`;

  const handleLoadStrategy = () => {
    onLoadStrategy({
      name: 'Enhanced Williams Fractal + Multi-Indicator Strategy',
      code: strategyCode,
      timeframe: '1m',
      stopLoss: 30,
      takeProfit: 45,
      riskPerTrade: 2,
      riskModel: 'dynamic'
    });
  };

  return (
    <Card className="bg-slate-700 border-slate-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5 text-green-400" />
          Enhanced Williams Fractal + Multi-Indicator Strategy
        </CardTitle>
        <p className="text-slate-400 text-sm">
          Advanced strategy using Williams Fractals, Triple EMA, RSI, ATR, and Stochastic confirmations
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
              <li>• RSI {'< 40'} (oversold confirmation)</li>
              <li>• Stochastic {'< 30'} (momentum)</li>
              <li>• Volume above 20-period average</li>
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
              <li>• RSI {'> 60'} (overbought confirmation)</li>
              <li>• Stochastic {'> 70'} (momentum)</li>
              <li>• Volume confirmation required</li>
            </ul>
          </div>
          
          <div className="bg-slate-800 p-3 rounded border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium text-sm">Signal Strength</span>
            </div>
            <ul className="text-slate-300 text-xs space-y-1">
              <li>• Minimum 5 points required</li>
              <li>• Base signal: 3 points</li>
              <li>• RSI confirmation: +2 points</li>
              <li>• Stochastic: +2 points</li>
              <li>• Volume: +1 point</li>
              <li>• ATR proximity: +1 point</li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-800 p-3 rounded border border-slate-600">
          <h4 className="text-white text-sm font-medium mb-2">Available Indicators (9 total):</h4>
          <div className="grid grid-cols-2 gap-2 text-slate-400 text-xs">
            <div>✓ Williams Fractals (period=2)</div>
            <div>✓ Triple EMA (20, 50, 100)</div>
            <div>✓ RSI (14-period)</div>
            <div>✓ ATR (14-period volatility)</div>
            <div>✓ Stochastic Oscillator (14,3)</div>
            <div>✓ Volume SMA (20-period)</div>
            <div>✓ MACD (available but not used here)</div>
            <div>✓ Bollinger Bands (available)</div>
            <div>✓ Commodity Channel Index (CCI)</div>
          </div>
        </div>

        <Button 
          onClick={handleLoadStrategy}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          Load Enhanced Multi-Indicator Strategy
        </Button>
      </CardContent>
    </Card>
  );
};

export default WilliamsFractalStrategy;
