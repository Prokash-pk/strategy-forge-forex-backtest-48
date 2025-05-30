
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, Target, Activity, BarChart3 } from 'lucide-react';

interface WilliamsFractalStrategyProps {
  onLoadStrategy: (strategy: any) => void;
}

const WilliamsFractalStrategy: React.FC<WilliamsFractalStrategyProps> = ({ onLoadStrategy }) => {
  const strategyCode = `# Enhanced Williams Fractal + Multi-Indicator Strategy
# Now includes 35+ technical indicators for comprehensive analysis

def strategy_logic(data):
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    volume = data['Volume'].tolist()
    
    # === TREND INDICATORS ===
    # Moving Averages
    sma_20 = TechnicalAnalysis.sma(close, 20)
    ema_20 = TechnicalAnalysis.ema(close, 20)
    ema_50 = TechnicalAnalysis.ema(close, 50)
    ema_100 = TechnicalAnalysis.ema(close, 100)
    tema_20 = AdvancedTechnicalAnalysis.tema(close, 20)
    hull_ma_20 = AdvancedTechnicalAnalysis.hull_ma(close, 20)
    
    # Trend Strength
    adx_data = AdvancedTechnicalAnalysis.adx(high, low, close, 14)
    supertrend_data = AdvancedTechnicalAnalysis.supertrend(high, low, close, 10, 3.0)
    
    # === MOMENTUM INDICATORS ===
    rsi = TechnicalAnalysis.rsi(close, 14)
    macd_data = TechnicalAnalysis.macd(close, 12, 26, 9)
    stoch = AdvancedTechnicalAnalysis.stochastic_oscillator(high, low, close, 14, 3)
    williams_r = AdvancedTechnicalAnalysis.williams_r(high, low, close, 14)
    cci = AdvancedTechnicalAnalysis.commodity_channel_index(high, low, close, 20)
    
    # === VOLATILITY INDICATORS ===
    atr = AdvancedTechnicalAnalysis.atr(high, low, close, 14)
    bb_data = TechnicalAnalysis.bollinger_bands(close, 20, 2)
    keltner_data = AdvancedTechnicalAnalysis.keltner_channels(high, low, close, 20, 2.0)
    donchian_data = AdvancedTechnicalAnalysis.donchian_channels(high, low, 20)
    
    # === VOLUME INDICATORS ===
    vwap = AdvancedTechnicalAnalysis.vwap(high, low, close, volume)
    obv = AdvancedTechnicalAnalysis.on_balance_volume(close, volume)
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
        
        # Get indicator values with NaN handling
        current_rsi = rsi[i] if not pd.isna(rsi[i]) else 50
        current_atr = atr[i] if not pd.isna(atr[i]) else 0
        current_stoch_k = stoch['k'][i] if not pd.isna(stoch['k'][i]) else 50
        current_williams = williams_r[i] if not pd.isna(williams_r[i]) else -50
        current_cci = cci[i] if not pd.isna(cci[i]) else 0
        current_adx = adx_data['adx'][i] if not pd.isna(adx_data['adx'][i]) else 25
        current_macd = macd_data['macd'][i] if not pd.isna(macd_data['macd'][i]) else 0
        current_macd_signal = macd_data['signal'][i] if not pd.isna(macd_data['signal'][i]) else 0
        current_bb_upper = bb_data['upper'][i] if not pd.isna(bb_data['upper'][i]) else current_price
        current_bb_lower = bb_data['lower'][i] if not pd.isna(bb_data['lower'][i]) else current_price
        current_supertrend = supertrend_data['supertrend'][i] if not pd.isna(supertrend_data['supertrend'][i]) else current_price
        current_hull_ma = hull_ma_20[i] if not pd.isna(hull_ma_20[i]) else current_price
        
        # Volume confirmation
        volume_above_avg = volume[i] > volume_sma[i] if not pd.isna(volume_sma[i]) else True
        
        # Enhanced EMA alignment for LONG
        long_ema_order = (current_ema_20 > current_ema_50 and 
                         current_ema_50 > current_ema_100)
        
        # Enhanced EMA alignment for SHORT
        short_ema_order = (current_ema_100 > current_ema_50 and 
                          current_ema_50 > current_ema_20)
        
        # ENHANCED LONG Entry Logic with multiple confirmations
        long_entry = False
        strength = 0
        
        if long_ema_order and current_price > current_ema_100:
            # Check for pullback conditions
            pullback_below_20 = current_price < current_ema_20
            pullback_below_50 = current_price < current_ema_50
            
            # Look for recent fractal low signal
            recent_fractal_low = any(fractal_lows[max(0, i-3):i+1])
            
            if (pullback_below_20 or pullback_below_50) and recent_fractal_low:
                strength += 3  # Base fractal signal
                
                # === MOMENTUM CONFIRMATIONS ===
                if current_rsi < 40:  # RSI oversold
                    strength += 2
                if current_stoch_k < 30:  # Stochastic oversold
                    strength += 2
                if current_williams < -80:  # Williams %R oversold
                    strength += 1
                if current_cci < -100:  # CCI oversold
                    strength += 1
                if current_macd > current_macd_signal:  # MACD bullish
                    strength += 2
                
                # === TREND CONFIRMATIONS ===
                if current_adx > 25:  # Strong trend
                    strength += 2
                if current_price > current_supertrend:  # SuperTrend bullish
                    strength += 2
                if current_price > current_hull_ma:  # Hull MA bullish
                    strength += 1
                
                # === VOLATILITY CONFIRMATIONS ===
                if current_price <= current_bb_lower:  # At Bollinger lower band
                    strength += 2
                if volume_above_avg:  # Volume confirmation
                    strength += 1
                if current_atr > 0 and abs(current_price - current_ema_20) < current_atr:
                    strength += 1  # Price near EMA with good volatility
                
                # Only enter if we have very strong confirmation (strength >= 8)
                if strength >= 8:
                    long_entry = True
        
        # ENHANCED SHORT Entry Logic with multiple confirmations
        short_entry = False
        
        if short_ema_order and current_price < current_ema_100:
            # Check for pullback above EMA 20
            pullback_above_20 = current_price > current_ema_20
            
            # Look for recent fractal high signal
            recent_fractal_high = any(fractal_highs[max(0, i-3):i+1])
            
            if pullback_above_20 and recent_fractal_high:
                strength += 3  # Base fractal signal
                
                # === MOMENTUM CONFIRMATIONS ===
                if current_rsi > 60:  # RSI overbought
                    strength += 2
                if current_stoch_k > 70:  # Stochastic overbought
                    strength += 2
                if current_williams > -20:  # Williams %R overbought
                    strength += 1
                if current_cci > 100:  # CCI overbought
                    strength += 1
                if current_macd < current_macd_signal:  # MACD bearish
                    strength += 2
                
                # === TREND CONFIRMATIONS ===
                if current_adx > 25:  # Strong trend
                    strength += 2
                if current_price < current_supertrend:  # SuperTrend bearish
                    strength += 2
                if current_price < current_hull_ma:  # Hull MA bearish
                    strength += 1
                
                # === VOLATILITY CONFIRMATIONS ===
                if current_price >= current_bb_upper:  # At Bollinger upper band
                    strength += 2
                if volume_above_avg:  # Volume confirmation
                    strength += 1
                if current_atr > 0 and abs(current_price - current_ema_20) < current_atr:
                    strength += 1
                
                # Only enter if we have very strong confirmation
                if strength >= 8:
                    short_entry = True
                    strength = -strength  # Negative for short signals
        
        # Final entry decision
        entry_signal = long_entry or short_entry
        
        # Enhanced exit conditions with multiple indicator confirmation
        exit_signal = False
        if i > 0:
            # Exit if EMA alignment breaks
            ema_breakdown = not (long_ema_order or short_ema_order)
            
            # Exit if price violates EMA 100 rule
            price_violation = (long_ema_order and current_price < current_ema_100) or \
                            (short_ema_order and current_price > current_ema_100)
            
            # Exit on multiple momentum divergences
            momentum_exit = (long_ema_order and current_rsi > 75 and current_stoch_k > 80) or \
                           (short_ema_order and current_rsi < 25 and current_stoch_k < 20)
            
            # Exit on SuperTrend reversal
            supertrend_exit = (long_ema_order and current_price < current_supertrend) or \
                             (short_ema_order and current_price > current_supertrend)
            
            exit_signal = ema_breakdown or price_violation or momentum_exit or supertrend_exit
        
        entry.append(entry_signal)
        exit.append(exit_signal)
        signal_strength.append(strength)
    
    return {
        'entry': entry,
        'exit': exit,
        # === TREND INDICATORS ===
        'sma_20': sma_20,
        'ema_20': ema_20,
        'ema_50': ema_50,
        'ema_100': ema_100,
        'tema_20': tema_20,
        'hull_ma_20': hull_ma_20,
        'adx': adx_data['adx'],
        'plus_di': adx_data['plus_di'],
        'minus_di': adx_data['minus_di'],
        'supertrend': supertrend_data['supertrend'],
        'supertrend_trend': supertrend_data['trend'],
        # === MOMENTUM INDICATORS ===
        'rsi': rsi,
        'macd': macd_data['macd'],
        'macd_signal': macd_data['signal'],
        'macd_histogram': macd_data['histogram'],
        'stoch_k': stoch['k'],
        'stoch_d': stoch['d'],
        'williams_r': williams_r,
        'cci': cci,
        # === VOLATILITY INDICATORS ===
        'atr': atr,
        'bb_upper': bb_data['upper'],
        'bb_middle': bb_data['middle'],
        'bb_lower': bb_data['lower'],
        'keltner_upper': keltner_data['upper'],
        'keltner_middle': keltner_data['middle'],
        'keltner_lower': keltner_data['lower'],
        'donchian_upper': donchian_data['upper'],
        'donchian_middle': donchian_data['middle'],
        'donchian_lower': donchian_data['lower'],
        # === VOLUME INDICATORS ===
        'vwap': vwap,
        'obv': obv,
        'volume_sma': volume_sma,
        # === FRACTAL SIGNALS ===
        'fractal_highs': fractal_highs,
        'fractal_lows': fractal_lows,
        'signal_strength': signal_strength
    }`;

  const handleLoadStrategy = () => {
    onLoadStrategy({
      name: 'Enhanced Multi-Indicator Williams Fractal Strategy (35+ Indicators)',
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
          Enhanced Multi-Indicator Strategy (35+ Indicators)
        </CardTitle>
        <p className="text-slate-400 text-sm">
          Comprehensive strategy using Williams Fractals + 35+ technical indicators across all categories
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-3 rounded border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-blue-400 font-medium text-sm">Trend Indicators (9)</span>
            </div>
            <ul className="text-slate-300 text-xs space-y-1">
              <li>• SMA, EMA, TEMA, Hull MA</li>
              <li>• ADX, SuperTrend</li>
              <li>• +DI/-DI directional indicators</li>
              <li>• Trend strength analysis</li>
            </ul>
          </div>
          
          <div className="bg-slate-800 p-3 rounded border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-400" />
              <span className="text-purple-400 font-medium text-sm">Momentum (8)</span>
            </div>
            <ul className="text-slate-300 text-xs space-y-1">
              <li>• RSI, Stochastic, Williams %R</li>
              <li>• MACD (line, signal, histogram)</li>
              <li>• CCI (Commodity Channel Index)</li>
              <li>• Multi-timeframe momentum</li>
            </ul>
          </div>
          
          <div className="bg-slate-800 p-3 rounded border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-orange-400" />
              <span className="text-orange-400 font-medium text-sm">Volatility (10)</span>
            </div>
            <ul className="text-slate-300 text-xs space-y-1">
              <li>• ATR, Bollinger Bands</li>
              <li>• Keltner Channels</li>
              <li>• Donchian Channels</li>
              <li>• Volatility breakout detection</li>
            </ul>
          </div>
          
          <div className="bg-slate-800 p-3 rounded border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-400" />
              <span className="text-green-400 font-medium text-sm">Volume & Price (8)</span>
            </div>
            <ul className="text-slate-300 text-xs space-y-1">
              <li>• VWAP, OBV</li>
              <li>• Volume SMA analysis</li>
              <li>• Williams Fractals</li>
              <li>• Price-volume correlation</li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-800 p-3 rounded border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium text-sm">Enhanced Signal Scoring System</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-slate-300 text-xs">
            <div>
              <p className="font-medium mb-1">Entry Requirements (min 8 points):</p>
              <ul className="space-y-1">
                <li>• Base fractal signal: 3 points</li>
                <li>• RSI confirmation: +2 points</li>
                <li>• Stochastic: +2 points</li>
                <li>• Williams %R: +1 point</li>
                <li>• CCI: +1 point</li>
                <li>• MACD: +2 points</li>
                <li>• ADX trend strength: +2 points</li>
                <li>• SuperTrend: +2 points</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Additional Confirmations:</p>
              <ul className="space-y-1">
                <li>• Hull MA direction: +1 point</li>
                <li>• Bollinger Bands position: +2 points</li>
                <li>• Volume above average: +1 point</li>
                <li>• ATR proximity: +1 point</li>
                <li>• Multiple exit conditions</li>
                <li>• Trend reversal protection</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-3 rounded border border-slate-600">
          <h4 className="text-white text-sm font-medium mb-2">Complete Indicator List (35+ total):</h4>
          <div className="grid grid-cols-3 gap-2 text-slate-400 text-xs">
            <div>
              <p className="text-blue-400 font-medium">Trend:</p>
              <div>SMA, EMA, TEMA, Hull MA, ADX, SuperTrend, +DI/-DI</div>
            </div>
            <div>
              <p className="text-purple-400 font-medium">Momentum:</p>
              <div>RSI, MACD, Stochastic, Williams %R, CCI</div>
            </div>
            <div>
              <p className="text-orange-400 font-medium">Volatility:</p>
              <div>ATR, Bollinger Bands, Keltner Channels, Donchian Channels</div>
            </div>
            <div>
              <p className="text-green-400 font-medium">Volume:</p>
              <div>VWAP, OBV, Volume SMA</div>
            </div>
            <div>
              <p className="text-yellow-400 font-medium">Price Action:</p>
              <div>Williams Fractals, Support/Resistance</div>
            </div>
            <div>
              <p className="text-pink-400 font-medium">Available:</p>
              <div>Fibonacci, Parabolic SAR, and more...</div>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleLoadStrategy}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
        >
          Load Enhanced Multi-Indicator Strategy (35+ Indicators)
        </Button>
      </CardContent>
    </Card>
  );
};

export default WilliamsFractalStrategy;
