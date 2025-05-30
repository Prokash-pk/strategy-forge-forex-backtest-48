import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface WilliamsFractalStrategyProps {
  onAddToStrategy: (codeSnippet: string) => void;
}

const WilliamsFractalStrategy: React.FC<WilliamsFractalStrategyProps> = ({ onAddToStrategy }) => {
  const [fractalLookback, setFractalLookback] = useState(5);
  const [volumeMultiplier, setVolumeMultiplier] = useState(1.2);
  const [minSignalStrength, setMinSignalStrength] = useState(3);
  const [minPatternStrength, setMinPatternStrength] = useState(2);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const { toast } = useToast();

  const indicatorOptions = [
    { value: 'ema_triple', label: 'Triple EMA (TEMA)' },
    { value: 'rsi', label: 'Relative Strength Index (RSI)' },
    { value: 'atr', label: 'Average True Range (ATR)' },
    { value: 'stochastic', label: 'Stochastic Oscillator' },
    { value: 'supertrend', label: 'Supertrend' },
    { value: 'hull_ma', label: 'Hull Moving Average (HMA)' },
    { value: 'williams_r', label: 'Williams %R' },
    { value: 'cci', label: 'Commodity Channel Index (CCI)' },
  ];

  const handleIndicatorToggle = (indicator: string) => {
    setSelectedIndicators(prev =>
      prev.includes(indicator) ? prev.filter(i => i !== indicator) : [...prev, indicator]
    );
  };

  const generateEnhancedStrategy = () => {
    const strategyCode = `# Enhanced Williams Fractal Strategy with S&R and Price Action
# Comprehensive trading strategy with support/resistance detection and pattern recognition

def strategy_logic(data):
    high = data['High'].tolist()
    low = data['Low'].tolist()
    close = data['Close'].tolist()
    open_prices = data['Open'].tolist()
    volume = data['Volume'].tolist()
    
    entry = []
    exit = []
    signals = {
        'fractals': {'highs': [], 'lows': []},
        'support_resistance': {'levels': [], 'strength': []},
        'price_patterns': {'pattern_type': [], 'pattern_strength': []},
        'pivot_points': {'daily': [], 'fibonacci': []},
        'volume_profile': {'poc': [], 'high_volume_levels': []}
    }

    # Calculate all indicators and patterns
    fractals = SupportResistanceDetection.fractal_levels(high, low, ${fractalLookback})
    pivot_standard = SupportResistanceDetection.pivot_points_standard(
        max(high[-20:]), min(low[-20:]), close[-1]
    ) if len(close) >= 20 else {}
    
    pivot_fib = SupportResistanceDetection.pivot_points_fibonacci(
        max(high[-20:]), min(low[-20:]), close[-1]
    ) if len(close) >= 20 else {}
    
    supply_demand = SupportResistanceDetection.supply_demand_zones(high, low, close, volume, 2)
    volume_profile = SupportResistanceDetection.volume_profile_levels(close, volume, 20)
    
    # Price action patterns
    pin_bars = PriceActionPatterns.pin_bar(open_prices, high, low, close, 0.3)
    engulfing = PriceActionPatterns.engulfing_pattern(open_prices, high, low, close)
    doji_patterns = PriceActionPatterns.doji_patterns(open_prices, high, low, close, 0.1)
    star_patterns = PriceActionPatterns.morning_evening_star(open_prices, high, low, close)
    inside_outside = PriceActionPatterns.inside_outside_bars(open_prices, high, low, close)
    
    # Enhanced indicators
    ${selectedIndicators.includes('ema_triple') ? `
    tema_12 = AdvancedTechnicalAnalysis.tema(close, 12)
    tema_26 = AdvancedTechnicalAnalysis.tema(close, 26)
    ` : ''}
    
    ${selectedIndicators.includes('rsi') ? `
    rsi = TechnicalAnalysis.rsi(close, 14)
    ` : ''}
    
    ${selectedIndicators.includes('atr') ? `
    atr = AdvancedTechnicalAnalysis.atr(high, low, close, 14)
    ` : ''}
    
    ${selectedIndicators.includes('stochastic') ? `
    stoch = AdvancedTechnicalAnalysis.stochastic_oscillator(high, low, close, 14, 3, 3)
    ` : ''}
    
    ${selectedIndicators.includes('supertrend') ? `
    supertrend = AdvancedTechnicalAnalysis.supertrend(high, low, close, 10, 3.0)
    ` : ''}
    
    ${selectedIndicators.includes('hull_ma') ? `
    hull_ma = AdvancedTechnicalAnalysis.hull_ma(close, 21)
    ` : ''}
    
    ${selectedIndicators.includes('williams_r') ? `
    williams_r = AdvancedTechnicalAnalysis.williams_r(high, low, close, 14)
    ` : ''}
    
    ${selectedIndicators.includes('cci') ? `
    cci = AdvancedTechnicalAnalysis.commodity_channel_index(high, low, close, 20)
    ` : ''}
    
    ${selectedIndicators.includes('parabolic_sar') ? `
    parabolic_sar = AdvancedTechnicalAnalysis.parabolic_sar(high, low, close, 0.02, 0.2)
    ` : ''}

    for i in range(len(data)):
        signal_strength = 0
        pattern_strength = 0
        sr_strength = 0
        
        # Fractal signals
        fractal_high = not math.isnan(fractals['fractal_highs'][i])
        fractal_low = not math.isnan(fractals['fractal_lows'][i])
        
        # Support/Resistance analysis
        current_price = close[i]
        near_support = False
        near_resistance = False
        
        # Check proximity to pivot levels
        for level_name, level_value in pivot_standard.items():
            if abs(current_price - level_value) / current_price < 0.002:  # Within 0.2%
                if 'support' in level_name:
                    near_support = True
                    sr_strength += 2
                elif 'resistance' in level_name:
                    near_resistance = True
                    sr_strength += 2
        
        # Check supply/demand zones
        for zone in supply_demand['demand_zones']:
            if zone['low'] <= current_price <= zone['high']:
                near_support = True
                sr_strength += zone['strength']
        
        for zone in supply_demand['supply_zones']:
            if zone['low'] <= current_price <= zone['high']:
                near_resistance = True
                sr_strength += zone['strength']
        
        # Price action pattern analysis
        current_pin = pin_bars[i]
        current_engulf = engulfing[i]
        current_doji = doji_patterns[i]
        current_star = star_patterns[i]
        current_inside_outside = inside_outside[i]
        
        # Bullish patterns
        if current_pin['type'] == 'bullish_pin':
            pattern_strength += current_pin['strength'] // 10
        if current_engulf['type'] == 'bullish_engulfing':
            pattern_strength += current_engulf['strength'] // 10
        if current_star['type'] == 'morning_star':
            pattern_strength += current_star['strength'] // 10
        if current_doji['type'] == 'dragonfly_doji':
            pattern_strength += current_doji['strength'] // 20
        
        # Bearish patterns (for exit signals)
        bearish_pattern = (current_pin['type'] == 'bearish_pin' or 
                          current_engulf['type'] == 'bearish_engulfing' or
                          current_star['type'] == 'evening_star' or
                          current_doji['type'] == 'gravestone_doji')
        
        # Enhanced indicator signals
        ${selectedIndicators.includes('ema_triple') ? `
        if i > 0 and not math.isnan(tema_12[i]) and not math.isnan(tema_26[i]):
            if tema_12[i] > tema_26[i] and tema_12[i-1] <= tema_26[i-1]:
                signal_strength += 3  # TEMA bullish crossover
        ` : ''}
        
        ${selectedIndicators.includes('rsi') ? `
        if not math.isnan(rsi[i]):
            if rsi[i] < 30:  # Oversold
                signal_strength += 2
            elif rsi[i] > 70:  # Overbought
                signal_strength -= 2
        ` : ''}
        
        ${selectedIndicators.includes('stochastic') ? `
        if not math.isnan(stoch['k'][i]) and not math.isnan(stoch['d'][i]):
            if stoch['k'][i] > stoch['d'][i] and stoch['k'][i] < 20:
                signal_strength += 2  # Stoch bullish in oversold
        ` : ''}
        
        ${selectedIndicators.includes('supertrend') ? `
        if not math.isnan(supertrend['supertrend'][i]):
            if supertrend['trend'][i] == -1:  # Bullish trend
                signal_strength += 2
        ` : ''}
        
        ${selectedIndicators.includes('williams_r') ? `
        if not math.isnan(williams_r[i]):
            if williams_r[i] > -80 and i > 0 and williams_r[i-1] <= -80:
                signal_strength += 2  # Williams %R bullish signal
        ` : ''}
        
        ${selectedIndicators.includes('cci') ? `
        if not math.isnan(cci[i]):
            if cci[i] > -100 and i > 0 and cci[i-1] <= -100:
                signal_strength += 2  # CCI bullish signal
        ` : ''}
        
        # Volume confirmation
        if i >= 10:
            avg_volume = sum(volume[i-10:i]) / 10
            if volume[i] > avg_volume * ${volumeMultiplier}:
                signal_strength += 1
        
        # Comprehensive entry logic
        entry_condition = (
            fractal_low and 
            near_support and 
            pattern_strength >= ${minPatternStrength} and
            signal_strength >= ${minSignalStrength} and
            sr_strength >= 2
        )
        
        # Enhanced exit logic
        exit_condition = (
            fractal_high or 
            near_resistance or 
            bearish_pattern or
            signal_strength < -2
        )
        
        entry.append(entry_condition)
        exit.append(exit_condition)
        
        # Store analysis data
        signals['fractals']['highs'].append(fractal_high)
        signals['fractals']['lows'].append(fractal_low)
        signals['support_resistance']['levels'].append(sr_strength)
        signals['support_resistance']['strength'].append(near_support or near_resistance)
        signals['price_patterns']['pattern_type'].append([
            current_pin['type'], current_engulf['type'], current_doji['type']
        ])
        signals['price_patterns']['pattern_strength'].append(pattern_strength)
        
        # Pivot points (same for all bars in daily context)
        signals['pivot_points']['daily'].append(pivot_standard)
        signals['pivot_points']['fibonacci'].append(pivot_fib)
        
        # Volume profile POC
        signals['volume_profile']['poc'].append(volume_profile.get('poc', float('nan')))
        signals['volume_profile']['high_volume_levels'].append(
            volume_profile.get('levels', [])[:5] if volume_profile.get('levels') else []
        )

    return {
        'entry': entry,
        'exit': exit,
        'fractals_high': fractals['fractal_highs'],
        'fractals_low': fractals['fractal_lows'],
        'signals': signals,
        'supply_zones': supply_demand['supply_zones'],
        'demand_zones': supply_demand['demand_zones'],
        'volume_profile': volume_profile,
        'pivot_points_standard': pivot_standard,
        'pivot_points_fibonacci': pivot_fib
    }`;

    onAddToStrategy(strategyCode);
    
    toast({
      title: "Enhanced Strategy Generated! 🎯",
      description: `Advanced strategy with ${selectedIndicators.length} indicators, S&R detection, and price action patterns`,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fractalLookback">Fractal Lookback Period</Label>
        <Slider
          id="fractalLookback"
          defaultValue={[fractalLookback]}
          max={10}
          min={2}
          step={1}
          onValueChange={(value) => setFractalLookback(value[0])}
        />
        <p className="text-sm text-muted-foreground">
          Adjust the lookback period for fractal swing highs/lows.
        </p>
      </div>

      <div>
        <Label htmlFor="volumeMultiplier">Volume Multiplier</Label>
        <Slider
          id="volumeMultiplier"
          defaultValue={[volumeMultiplier]}
          max={3}
          min={1}
          step={0.1}
          onValueChange={(value) => setVolumeMultiplier(value[0])}
        />
        <p className="text-sm text-muted-foreground">
          Set the volume multiplier for confirmation signals.
        </p>
      </div>

      <div>
        <Label htmlFor="minSignalStrength">Minimum Signal Strength</Label>
        <Slider
          id="minSignalStrength"
          defaultValue={[minSignalStrength]}
          max={5}
          min={1}
          step={1}
          onValueChange={(value) => setMinSignalStrength(value[0])}
        />
        <p className="text-sm text-muted-foreground">
          Define the minimum signal strength required for entry.
        </p>
      </div>

      <div>
        <Label htmlFor="minPatternStrength">Minimum Pattern Strength</Label>
        <Slider
          id="minPatternStrength"
          defaultValue={[minPatternStrength]}
          max={5}
          min={1}
          step={1}
          onValueChange={(value) => setMinPatternStrength(value[0])}
        />
        <p className="text-sm text-muted-foreground">
          Set the minimum pattern strength for price action confirmation.
        </p>
      </div>

      <div>
        <Label>Select Enhanced Indicators</Label>
        <div className="grid gap-2 grid-cols-2">
          {indicatorOptions.map((indicator) => (
            <div key={indicator.value} className="flex items-center space-x-2">
              <Switch
                id={indicator.value}
                checked={selectedIndicators.includes(indicator.value)}
                onCheckedChange={() => handleIndicatorToggle(indicator.value)}
              />
              <Label htmlFor={indicator.value}>{indicator.label}</Label>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Choose additional indicators to enhance the strategy.
        </p>
      </div>

      <Button onClick={generateEnhancedStrategy}>Add Enhanced Strategy to Code</Button>
    </div>
  );
};

export default WilliamsFractalStrategy;
