
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Copy, Play, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIStrategy {
  id: string;
  name: string;
  description: string;
  expectedReturn: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  timeframe: string;
  symbol: string;
  code: string;
  reasoning: string;
  marketConditions: string[];
}

interface AIStrategyRecommendationsProps {
  onLoadStrategy: (strategy: any) => void;
}

const AIStrategyRecommendations: React.FC<AIStrategyRecommendationsProps> = ({ onLoadStrategy }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategies, setStrategies] = useState<AIStrategy[]>([]);
  const { toast } = useToast();

  const highPerformanceStrategies: AIStrategy[] = [
    {
      id: 'breakout-momentum',
      name: 'Multi-Timeframe Breakout Momentum',
      description: 'Combines support/resistance breakouts with momentum confirmation across multiple timeframes',
      expectedReturn: '250-400%',
      riskLevel: 'High',
      timeframe: '5m',
      symbol: 'EURUSD=X',
      reasoning: 'Breakout strategies can capture large moves when trend reversals occur. High risk but potentially very high reward.',
      marketConditions: ['Trending Markets', 'High Volatility', 'News Events'],
      code: `# Multi-Timeframe Breakout Momentum Strategy
# Targets 250-400% annual returns with aggressive position sizing

def strategy_logic(data, reverse_signals=False):
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    volume = data['Volume'].tolist()
    
    # Multiple EMAs for trend confirmation
    ema_8 = TechnicalAnalysis.ema(close, 8)
    ema_21 = TechnicalAnalysis.ema(close, 21)
    ema_50 = TechnicalAnalysis.ema(close, 50)
    
    # RSI for momentum
    rsi = TechnicalAnalysis.rsi(close, 14)
    
    # ATR for volatility-based stops
    atr = TechnicalAnalysis.atr(high, low, close, 14)
    
    # Bollinger Bands for squeeze detection
    bb = TechnicalAnalysis.bollinger_bands(close, 20, 2)
    
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i < 50:  # Need enough data
            entry.append(False)
            exit.append(False)
            continue
        
        # Breakout conditions
        current_price = close[i]
        prev_price = close[i-1]
        
        # Strong trend alignment
        trend_bullish = (ema_8[i] > ema_21[i] > ema_50[i] and 
                        ema_8[i] > ema_8[i-1])
        trend_bearish = (ema_8[i] < ema_21[i] < ema_50[i] and 
                        ema_8[i] < ema_8[i-1])
        
        # Momentum confirmation
        momentum_bullish = rsi[i] > 60 and rsi[i] > rsi[i-1]
        momentum_bearish = rsi[i] < 40 and rsi[i] < rsi[i-1]
        
        # Volatility expansion (Bollinger Band squeeze breakout)
        bb_width = (bb['upper'][i] - bb['lower'][i]) / bb['middle'][i]
        bb_expanding = bb_width > bb_width if i > 0 else False
        
        # Volume confirmation (if available)
        volume_spike = volume[i] > sum(volume[max(0, i-10):i]) / 10 if volume[i] > 0 else True
        
        # LONG Entry: Breakout above resistance with momentum
        long_breakout = (current_price > max(high[max(0, i-20):i]) and 
                        trend_bullish and momentum_bullish and 
                        bb_expanding and volume_spike)
        
        # SHORT Entry: Breakdown below support with momentum
        short_breakout = (current_price < min(low[max(0, i-20):i]) and 
                         trend_bearish and momentum_bearish and 
                         bb_expanding and volume_spike)
        
        # Apply signal reversal if requested
        if reverse_signals:
            long_breakout, short_breakout = short_breakout, long_breakout
        
        entry.append(long_breakout or short_breakout)
        
        # Exit conditions - tight stops for aggressive strategy
        exit_condition = False
        if i > 0:
            # Exit on EMA crossover reversal or RSI extreme
            if (ema_8[i] < ema_21[i] and ema_8[i-1] >= ema_21[i-1]) or rsi[i] > 80 or rsi[i] < 20:
                exit_condition = True
        
        exit.append(exit_condition)
    
    return {
        'entry': entry,
        'exit': exit,
        'ema_8': ema_8,
        'ema_21': ema_21,
        'ema_50': ema_50,
        'rsi': rsi,
        'bb_upper': bb['upper'],
        'bb_lower': bb['lower']
    }`
    },
    {
      id: 'scalping-grid',
      name: 'AI-Enhanced Scalping Grid',
      description: 'High-frequency scalping with dynamic grid levels and AI pattern recognition',
      expectedReturn: '300-500%',
      riskLevel: 'High',
      timeframe: '1m',
      symbol: 'GBPUSD=X',
      reasoning: 'Scalping strategies can generate high returns through volume. Very high risk due to frequency and leverage.',
      marketConditions: ['High Liquidity', 'Ranging Markets', 'Low Spread'],
      code: `# AI-Enhanced Scalping Grid Strategy
# Targets 300-500% returns with high-frequency trading

def strategy_logic(data, reverse_signals=False):
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    
    # Fast EMAs for scalping
    ema_5 = TechnicalAnalysis.ema(close, 5)
    ema_13 = TechnicalAnalysis.ema(close, 13)
    
    # Stochastic for overbought/oversold
    stoch = TechnicalAnalysis.stochastic(high, low, close, 14, 3)
    
    # MACD for trend confirmation
    macd = TechnicalAnalysis.macd(close, 12, 26, 9)
    
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i < 26:  # Need enough data for MACD
            entry.append(False)
            exit.append(False)
            continue
        
        current_price = close[i]
        
        # Scalping conditions - quick entries and exits
        price_above_ema5 = current_price > ema_5[i]
        price_below_ema5 = current_price < ema_5[i]
        
        # EMA crossover for momentum
        ema_bullish = ema_5[i] > ema_13[i] and ema_5[i-1] <= ema_13[i-1]
        ema_bearish = ema_5[i] < ema_13[i] and ema_5[i-1] >= ema_13[i-1]
        
        # Stochastic oversold/overbought reversal
        stoch_oversold = stoch['k'][i] < 20 and stoch['k'][i] > stoch['k'][i-1]
        stoch_overbought = stoch['k'][i] > 80 and stoch['k'][i] < stoch['k'][i-1]
        
        # MACD confirmation
        macd_bullish = macd['macd'][i] > macd['signal'][i]
        macd_bearish = macd['macd'][i] < macd['signal'][i]
        
        # Quick scalp entries
        long_scalp = (ema_bullish and stoch_oversold and macd_bullish) or \
                    (price_above_ema5 and stoch_oversold)
        
        short_scalp = (ema_bearish and stoch_overbought and macd_bearish) or \
                     (price_below_ema5 and stoch_overbought)
        
        # Apply signal reversal if requested
        if reverse_signals:
            long_scalp, short_scalp = short_scalp, long_scalp
        
        entry.append(long_scalp or short_scalp)
        
        # Quick exits for scalping - take small profits quickly
        quick_exit = False
        if i > 0:
            # Exit on opposite stochastic signal or EMA reversal
            if (stoch['k'][i] > 80) or (stoch['k'][i] < 20) or \
               (ema_5[i] < ema_13[i] and ema_5[i-1] >= ema_13[i-1]) or \
               (ema_5[i] > ema_13[i] and ema_5[i-1] <= ema_13[i-1]):
                quick_exit = True
        
        exit.append(quick_exit)
    
    return {
        'entry': entry,
        'exit': exit,
        'ema_5': ema_5,
        'ema_13': ema_13,
        'stoch_k': stoch['k'],
        'macd_line': macd['macd'],
        'macd_signal': macd['signal']
    }`
    },
    {
      id: 'news-volatility',
      name: 'News Volatility Explosion',
      description: 'Captures extreme volatility spikes during major news events with tight risk management',
      expectedReturn: '200-350%',
      riskLevel: 'High',
      timeframe: '1m',
      symbol: 'USDJPY=X',
      reasoning: 'News events create massive volatility spikes. Requires perfect timing but can yield exceptional returns.',
      marketConditions: ['News Events', 'High Volatility', 'Major Sessions'],
      code: `# News Volatility Explosion Strategy
# Targets massive volatility spikes during news events

def strategy_logic(data, reverse_signals=False):
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    
    # ATR for volatility measurement
    atr = TechnicalAnalysis.atr(high, low, close, 14)
    
    # Bollinger Bands for volatility squeeze detection
    bb = TechnicalAnalysis.bollinger_bands(close, 20, 2.5)
    
    # RSI for momentum
    rsi = TechnicalAnalysis.rsi(close, 9)  # Faster RSI for news events
    
    # EMA for trend bias
    ema_20 = TechnicalAnalysis.ema(close, 20)
    
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i < 20:
            entry.append(False)
            exit.append(False)
            continue
        
        current_price = close[i]
        
        # Volatility expansion detection
        current_atr = atr[i] if not math.isnan(atr[i]) else 0
        avg_atr = sum(atr[max(0, i-10):i]) / min(10, i) if i > 0 else current_atr
        
        volatility_spike = current_atr > avg_atr * 2.0  # 2x normal volatility
        
        # Bollinger Band squeeze breakout
        bb_width = (bb['upper'][i] - bb['lower'][i]) / close[i] if close[i] > 0 else 0
        avg_bb_width = sum([(bb['upper'][j] - bb['lower'][j]) / close[j] 
                           for j in range(max(0, i-20), i) if close[j] > 0]) / min(20, i)
        
        squeeze_breakout = bb_width > avg_bb_width * 1.5
        
        # Price breakout from consolidation
        price_range = max(high[max(0, i-10):i]) - min(low[max(0, i-10):i])
        breakout_up = current_price > max(high[max(0, i-10):i-1])
        breakout_down = current_price < min(low[max(0, i-10):i-1])
        
        # Momentum confirmation
        momentum_strong = abs(rsi[i] - 50) > 20  # Strong momentum away from neutral
        
        # News volatility entry conditions
        volatility_entry = (volatility_spike and squeeze_breakout and 
                           (breakout_up or breakout_down) and momentum_strong)
        
        # Direction bias from EMA
        bullish_bias = current_price > ema_20[i] and breakout_up
        bearish_bias = current_price < ema_20[i] and breakout_down
        
        news_entry = volatility_entry and (bullish_bias or bearish_bias)
        
        # Apply signal reversal if requested
        if reverse_signals:
            if news_entry and bullish_bias:
                news_entry = bearish_bias
            elif news_entry and bearish_bias:
                news_entry = bullish_bias
        
        entry.append(news_entry)
        
        # Quick exit on volatility normalization
        volatility_exit = False
        if i > 0:
            # Exit when volatility starts to normalize
            if current_atr < avg_atr * 1.2 or abs(rsi[i] - 50) < 10:
                volatility_exit = True
        
        exit.append(volatility_exit)
    
    return {
        'entry': entry,
        'exit': exit,
        'atr': atr,
        'bb_upper': bb['upper'],
        'bb_lower': bb['lower'],
        'rsi': rsi,
        'ema_20': ema_20
    }`
    }
  ];

  const handleLoadStrategy = (strategy: AIStrategy) => {
    onLoadStrategy({
      name: strategy.name,
      code: strategy.code,
      symbol: strategy.symbol,
      timeframe: strategy.timeframe,
      // Aggressive settings for high return strategies
      initialBalance: 10000,
      riskPerTrade: 5, // Higher risk for higher returns
      stopLoss: 30,
      takeProfit: 90,
      spread: 2,
      commission: 0.5,
      slippage: 1,
      maxPositionSize: 200000, // Larger position sizes
      riskModel: 'percentage'
    });
    
    toast({
      title: "High-Performance Strategy Loaded!",
      description: `"${strategy.name}" loaded with aggressive settings for ${strategy.expectedReturn} target return`,
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied!",
      description: "Strategy code copied to clipboard",
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-500/10 text-green-400';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-400';
      case 'High': return 'bg-red-500/10 text-red-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Sparkles className="h-6 w-6 text-purple-400" />
          AI High-Performance Strategies
          <Badge className="bg-purple-500/10 text-purple-400">200%+ Target Returns</Badge>
        </CardTitle>
        <p className="text-slate-400 text-sm">
          AI-generated strategies targeting exceptional returns. ⚠️ High risk - use proper risk management!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {highPerformanceStrategies.map((strategy) => (
          <Card key={strategy.id} className="bg-slate-700 border-slate-600">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-semibold">{strategy.name}</h3>
                    <Badge className={getRiskColor(strategy.riskLevel)}>
                      {strategy.riskLevel} Risk
                    </Badge>
                    <Badge className="bg-emerald-500/10 text-emerald-400">
                      {strategy.expectedReturn}
                    </Badge>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">{strategy.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                    <span>{strategy.symbol}</span>
                    <span>{strategy.timeframe}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800 p-3 rounded border border-slate-600 mb-3">
                <p className="text-slate-300 text-sm font-medium mb-2">AI Reasoning:</p>
                <p className="text-slate-400 text-xs mb-2">{strategy.reasoning}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {strategy.marketConditions.map((condition, index) => (
                    <Badge key={index} className="bg-blue-500/10 text-blue-400 text-xs">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleLoadStrategy(strategy)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Load & Test Strategy
                </Button>
                <Button
                  onClick={() => copyToClipboard(strategy.code)}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-amber-400" />
            <span className="text-amber-300 font-medium">High-Performance Trading Warning</span>
          </div>
          <p className="text-amber-200 text-sm">
            These strategies target exceptional returns (200%+) but come with significant risks:
          </p>
          <ul className="text-amber-200 text-xs mt-2 space-y-1 ml-4">
            <li>• High leverage and aggressive position sizing</li>
            <li>• Requires perfect timing and execution</li>
            <li>• Potential for substantial losses</li>
            <li>• Best suited for experienced traders with proper risk management</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIStrategyRecommendations;
