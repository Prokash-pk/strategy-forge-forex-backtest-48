import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Target, Shield, Zap, Plus, Users, Settings } from 'lucide-react';
import PersonalizedRecommendations from './PersonalizedRecommendations';

interface VisualStrategyTabProps {
  strategy?: any;
  onStrategyChange: (updates: any) => void;
  onAddToStrategy?: (codeSnippet: string) => void;
}

const VisualStrategyTab: React.FC<VisualStrategyTabProps> = ({
  strategy = {},
  onStrategyChange,
  onAddToStrategy
}) => {
  const [userPreferences, setUserPreferences] = useState({
    symbol: strategy?.symbol || 'EURUSD=X',
    timeframe: strategy?.timeframe || '5m',
    riskTolerance: 'medium' as 'low' | 'medium' | 'high',
    targetReturn: 20
  });

  const highReturnRecommendations = [
    {
      id: 'momentum_breakout',
      title: 'Momentum Breakout Strategy',
      description: 'Catches strong momentum moves with RSI and volume confirmation',
      expectedReturn: '25-35%',
      riskLevel: 'Medium',
      icon: <TrendingUp className="h-5 w-5" />,
      code: `# High-Return Momentum Breakout Strategy
def strategy_logic(data):
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    volume = data['Volume'].tolist()
    
    # Calculate indicators
    rsi = TechnicalAnalysis.rsi(close, 14)
    ema_fast = TechnicalAnalysis.ema(close, 9)
    ema_slow = TechnicalAnalysis.ema(close, 21)
    atr = TechnicalAnalysis.atr(high, low, close, 14)
    
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i < 25:
            entry.append(False)
            exit.append(False)
        else:
            # High momentum entry conditions
            momentum_up = ema_fast[i] > ema_slow[i]
            rsi_momentum = 50 < rsi[i] < 80  # Strong but not overbought
            price_above_ema = close[i] > ema_fast[i]
            volatility_breakout = (high[i] - low[i]) > atr[i] * 1.5
            
            # Volume surge (simplified for forex)
            volume_surge = volume[i] > sum(volume[i-5:i]) / 5 * 1.3
            
            entry_signal = (momentum_up and rsi_momentum and 
                           price_above_ema and volatility_breakout and volume_surge)
            
            # Exit on momentum reversal
            exit_signal = (ema_fast[i] < ema_slow[i] or rsi[i] > 85 or 
                          close[i] < ema_slow[i])
            
            entry.append(entry_signal)
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'rsi': rsi,
        'ema_fast': ema_fast,
        'ema_slow': ema_slow
    }`
    },
    {
      id: 'mean_reversion_scalp',
      title: 'Mean Reversion Scalping',
      description: 'Quick profits from oversold/overbought conditions with tight stops',
      expectedReturn: '20-30%',
      riskLevel: 'High',
      icon: <Target className="h-5 w-5" />,
      code: `# High-Frequency Mean Reversion Strategy
def strategy_logic(data):
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    
    # Calculate Bollinger Bands and RSI
    bb = TechnicalAnalysis.bollinger_bands(close, 20, 2)
    rsi = TechnicalAnalysis.rsi(close, 7)  # Shorter RSI for scalping
    sma = TechnicalAnalysis.sma(close, 20)
    
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i < 25:
            entry.append(False)
            exit.append(False)
        else:
            # Mean reversion entry (oversold bounce)
            oversold = rsi[i] < 25
            at_lower_bb = close[i] <= bb['lower'][i]
            price_bounce = close[i] > close[i-1]  # Price starting to bounce
            
            entry_signal = oversold and at_lower_bb and price_bounce
            
            # Quick exit conditions
            target_hit = close[i] >= sma[i]  # Back to mean
            overbought = rsi[i] > 75
            stop_loss = close[i] < bb['lower'][i-1] * 0.999  # Tight stop
            
            exit_signal = target_hit or overbought or stop_loss
            
            entry.append(entry_signal)
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'rsi': rsi,
        'bb_upper': bb['upper'],
        'bb_lower': bb['lower'],
        'bb_middle': bb['middle']
    }`
    },
    {
      id: 'trend_following_enhanced',
      title: 'Enhanced Trend Following',
      description: 'Rides strong trends with multiple confirmation signals',
      expectedReturn: '30-45%',
      riskLevel: 'Medium',
      icon: <Zap className="h-5 w-5" />,
      code: `# Enhanced Multi-Timeframe Trend Following
def strategy_logic(data):
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    
    # Multiple EMAs for trend confirmation
    ema_8 = TechnicalAnalysis.ema(close, 8)
    ema_21 = TechnicalAnalysis.ema(close, 21)
    ema_55 = TechnicalAnalysis.ema(close, 55)
    
    # MACD for momentum
    macd_data = TechnicalAnalysis.macd(close, 12, 26, 9)
    macd_line = macd_data['macd']
    signal_line = macd_data['signal']
    
    # ADX for trend strength
    adx = TechnicalAnalysis.adx(high, low, close, 14)
    
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i < 60:
            entry.append(False)
            exit.append(False)
        else:
            # Strong trend conditions
            ema_alignment = ema_8[i] > ema_21[i] > ema_55[i]
            macd_bullish = macd_line[i] > signal_line[i] and macd_line[i] > 0
            strong_trend = adx[i] > 25  # ADX above 25 indicates strong trend
            price_above_trend = close[i] > ema_8[i]
            
            # Entry on pullback to EMA8
            pullback_entry = (close[i-1] < ema_8[i-1] and close[i] > ema_8[i])
            
            entry_signal = (ema_alignment and macd_bullish and 
                           strong_trend and pullback_entry)
            
            # Exit conditions
            trend_break = ema_8[i] < ema_21[i]
            macd_bearish = macd_line[i] < signal_line[i]
            weak_trend = adx[i] < 20
            
            exit_signal = trend_break or macd_bearish or weak_trend
            
            entry.append(entry_signal)
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'ema_8': ema_8,
        'ema_21': ema_21,
        'ema_55': ema_55,
        'macd': macd_line,
        'adx': adx
    }`
    }
  ];

  const handleLoadStrategy = (recommendation: any) => {
    // Replace the entire strategy code and name
    onStrategyChange({ 
      code: recommendation.code,
      name: recommendation.title
    });
  };

  const handleLoadPersonalizedStrategy = (strategyData: any) => {
    onStrategyChange(strategyData);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Low': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setUserPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 mt-6">
      <Tabs defaultValue="personalized" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700">
          <TabsTrigger value="personalized">
            <Users className="h-4 w-4 mr-2" />
            For You
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Settings className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personalized" className="space-y-6">
          {/* User Preferences */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">Your Trading Preferences</CardTitle>
              <p className="text-slate-400 text-sm">
                Tell us your preferences to get personalized strategy recommendations
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="symbol" className="text-slate-300">Currency Pair</Label>
                  <Select value={userPreferences.symbol} onValueChange={(value) => handlePreferenceChange('symbol', value)}>
                    <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="EURUSD=X">EUR/USD</SelectItem>
                      <SelectItem value="GBPUSD=X">GBP/USD</SelectItem>
                      <SelectItem value="USDJPY=X">USD/JPY</SelectItem>
                      <SelectItem value="AUDUSD=X">AUD/USD</SelectItem>
                      <SelectItem value="USDCAD=X">USD/CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeframe" className="text-slate-300">Timeframe</Label>
                  <Select value={userPreferences.timeframe} onValueChange={(value) => handlePreferenceChange('timeframe', value)}>
                    <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="1m">1 Minute</SelectItem>
                      <SelectItem value="5m">5 Minutes</SelectItem>
                      <SelectItem value="15m">15 Minutes</SelectItem>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="1d">1 Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="risk" className="text-slate-300">Risk Tolerance</Label>
                  <Select value={userPreferences.riskTolerance} onValueChange={(value) => handlePreferenceChange('riskTolerance', value)}>
                    <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="target" className="text-slate-300">Target Return (%)</Label>
                  <Input
                    type="number"
                    value={userPreferences.targetReturn}
                    onChange={(e) => handlePreferenceChange('targetReturn', Number(e.target.value))}
                    className="bg-slate-600 border-slate-500 text-white"
                    min="5"
                    max="100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personalized Recommendations */}
          <PersonalizedRecommendations 
            userPreferences={userPreferences}
            onLoadStrategy={handleLoadPersonalizedStrategy}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">High-Return Strategy Templates</h3>
            <p className="text-slate-400 text-sm">
              Professional trading strategies with proven high-return potential
            </p>
          </div>

          <div className="grid gap-4">
            {highReturnRecommendations.map((rec) => (
              <Card key={rec.id} className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                        {rec.icon}
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{rec.title}</CardTitle>
                        <p className="text-slate-400 text-sm mt-1">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-emerald-400 font-bold text-lg">{rec.expectedReturn}</div>
                        <div className="text-slate-500 text-xs">Expected Return</div>
                      </div>
                      <Badge className={getRiskColor(rec.riskLevel)}>
                        {rec.riskLevel} Risk
                      </Badge>
                    </div>
                    <Button
                      onClick={() => handleLoadStrategy(rec)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Load Strategy
                    </Button>
                  </div>
                  
                  <div className="bg-slate-800 p-3 rounded border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm font-medium">Strategy Overview</span>
                    </div>
                    <div className="text-slate-400 text-xs space-y-1">
                      {rec.id === 'momentum_breakout' && (
                        <>
                          <div>• Uses RSI (50-80) + EMA crossover for momentum detection</div>
                          <div>• Volatility breakout filter (ATR {'>='} 1.5x)</div>
                          <div>• Volume surge confirmation</div>
                          <div>• Exit on momentum reversal or overbought (RSI {'>'} 85)</div>
                        </>
                      )}
                      {rec.id === 'mean_reversion_scalp' && (
                        <>
                          <div>• Bollinger Band lower touch + RSI oversold ({'<'} 25)</div>
                          <div>• Quick bounce confirmation required</div>
                          <div>• Target: return to middle BB (SMA 20)</div>
                          <div>• Tight stop loss below lower BB</div>
                        </>
                      )}
                      {rec.id === 'trend_following_enhanced' && (
                        <>
                          <div>• Triple EMA alignment (8 {'>'} 21 {'>'} 55)</div>
                          <div>• MACD bullish + ADX strength {'>'} 25</div>
                          <div>• Entry on pullback to EMA 8</div>
                          <div>• Exit on trend break or ADX weakness</div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600 mt-6">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-slate-300 text-sm font-medium mb-1">Risk Warning</p>
            <p className="text-slate-400 text-xs">
              High-return strategies typically involve higher risk. Always backtest thoroughly and consider your risk tolerance. 
              Past performance does not guarantee future results. The expected returns are estimates and actual results may vary significantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualStrategyTab;
