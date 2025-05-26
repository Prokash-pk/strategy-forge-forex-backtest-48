
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Play, Save, Code, TrendingUp, DollarSign, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StrategyBuilderProps {
  onStrategyUpdate: (strategy: any) => void;
  onBacktestComplete: (results: any) => void;
}

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ onStrategyUpdate, onBacktestComplete }) => {
  const [strategy, setStrategy] = useState({
    name: 'EMA Crossover Strategy',
    symbol: 'EURUSD=X',
    timeframe: '5m',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    initialBalance: 10000,
    riskPerTrade: 1,
    stopLoss: 50,
    takeProfit: 100,
    spread: 2,
    commission: 0.5,
    slippage: 1,
    code: `# EMA Crossover Strategy
def strategy_logic(data):
    short_ema = data['Close'].ewm(span=12).mean()
    long_ema = data['Close'].ewm(span=26).mean()
    
    # Entry signal: short EMA crosses above long EMA
    entry = (short_ema > long_ema) & (short_ema.shift(1) <= long_ema.shift(1))
    
    # Exit signal: short EMA crosses below long EMA
    exit = (short_ema < long_ema) & (short_ema.shift(1) >= long_ema.shift(1))
    
    return {
        'entry': entry,
        'exit': exit,
        'short_ema': short_ema,
        'long_ema': long_ema
    }`
  });

  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const timeframes = [
    { value: '1m', label: '1 Minute', maxPeriod: '7 days' },
    { value: '5m', label: '5 Minutes', maxPeriod: '60 days' },
    { value: '15m', label: '15 Minutes', maxPeriod: '60 days' },
    { value: '1h', label: '1 Hour', maxPeriod: '730 days' },
    { value: '1d', label: '1 Day', maxPeriod: 'Years' }
  ];

  const symbols = [
    'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'USDCAD=X',
    'USDCHF=X', 'NZDUSD=X', 'EURGBP=X', 'EURJPY=X', 'GBPJPY=X'
  ];

  const runBacktest = async () => {
    setIsRunning(true);
    
    try {
      // Simulate backtest execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock results
      const mockResults = {
        strategy: strategy.name,
        symbol: strategy.symbol,
        timeframe: strategy.timeframe,
        period: `${strategy.startDate} to ${strategy.endDate}`,
        initialBalance: strategy.initialBalance,
        finalBalance: 12450.75,
        totalReturn: 24.51,
        totalTrades: 47,
        winningTrades: 28,
        losingTrades: 19,
        winRate: 59.57,
        maxDrawdown: 8.34,
        sharpeRatio: 1.86,
        profitFactor: 1.42,
        avgWin: 145.30,
        avgLoss: -89.45,
        equityCurve: generateMockEquityCurve(),
        trades: generateMockTrades()
      };

      onBacktestComplete(mockResults);
      
      toast({
        title: "Backtest Complete",
        description: `Strategy tested successfully with ${mockResults.totalTrades} trades`,
      });
    } catch (error) {
      toast({
        title: "Backtest Failed",
        description: "An error occurred while running the backtest",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const generateMockEquityCurve = () => {
    const points = [];
    let balance = strategy.initialBalance;
    for (let i = 0; i < 100; i++) {
      balance += (Math.random() - 0.4) * 200;
      points.push({ date: new Date(2024, 0, i + 1), balance });
    }
    return points;
  };

  const generateMockTrades = () => {
    const trades = [];
    for (let i = 1; i <= 47; i++) {
      trades.push({
        id: i,
        date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        type: Math.random() > 0.5 ? 'BUY' : 'SELL',
        entry: 1.0850 + (Math.random() - 0.5) * 0.1,
        exit: 1.0850 + (Math.random() - 0.5) * 0.1,
        pnl: (Math.random() - 0.4) * 500,
        duration: Math.floor(Math.random() * 240) + 15 // minutes
      });
    }
    return trades;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Strategy Configuration */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Code className="h-5 w-5" />
              Strategy Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="strategyName" className="text-slate-300">Strategy Name</Label>
                <Input
                  id="strategyName"
                  value={strategy.name}
                  onChange={(e) => setStrategy({...strategy, name: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="symbol" className="text-slate-300">Currency Pair</Label>
                <Select value={strategy.symbol} onValueChange={(value) => setStrategy({...strategy, symbol: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {symbols.map(symbol => (
                      <SelectItem key={symbol} value={symbol} className="text-white">
                        {symbol.replace('=X', '')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="timeframe" className="text-slate-300">Timeframe</Label>
                <Select value={strategy.timeframe} onValueChange={(value) => setStrategy({...strategy, timeframe: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {timeframes.map(tf => (
                      <SelectItem key={tf.value} value={tf.value} className="text-white">
                        {tf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate" className="text-slate-300">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={strategy.startDate}
                  onChange={(e) => setStrategy({...strategy, startDate: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-slate-300">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={strategy.endDate}
                  onChange={(e) => setStrategy({...strategy, endDate: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <Separator className="bg-slate-600" />

            <div>
              <Label htmlFor="code" className="text-slate-300">Strategy Code (Python)</Label>
              <Textarea
                id="code"
                value={strategy.code}
                onChange={(e) => setStrategy({...strategy, code: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white font-mono h-64 resize-none"
                placeholder="Enter your strategy logic here..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Management & Execution */}
      <div className="space-y-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <DollarSign className="h-5 w-5" />
              Risk Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="initialBalance" className="text-slate-300">Initial Balance ($)</Label>
              <Input
                id="initialBalance"
                type="number"
                value={strategy.initialBalance}
                onChange={(e) => setStrategy({...strategy, initialBalance: Number(e.target.value)})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="riskPerTrade" className="text-slate-300">Risk Per Trade (%)</Label>
              <Input
                id="riskPerTrade"
                type="number"
                step="0.1"
                value={strategy.riskPerTrade}
                onChange={(e) => setStrategy({...strategy, riskPerTrade: Number(e.target.value)})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stopLoss" className="text-slate-300">Stop Loss (pips)</Label>
                <Input
                  id="stopLoss"
                  type="number"
                  value={strategy.stopLoss}
                  onChange={(e) => setStrategy({...strategy, stopLoss: Number(e.target.value)})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="takeProfit" className="text-slate-300">Take Profit (pips)</Label>
                <Input
                  id="takeProfit"
                  type="number"
                  value={strategy.takeProfit}
                  onChange={(e) => setStrategy({...strategy, takeProfit: Number(e.target.value)})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5" />
              Execution Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="spread" className="text-slate-300">Spread (pips)</Label>
              <Input
                id="spread"
                type="number"
                step="0.1"
                value={strategy.spread}
                onChange={(e) => setStrategy({...strategy, spread: Number(e.target.value)})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="commission" className="text-slate-300">Commission ($)</Label>
              <Input
                id="commission"
                type="number"
                step="0.1"
                value={strategy.commission}
                onChange={(e) => setStrategy({...strategy, commission: Number(e.target.value)})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="slippage" className="text-slate-300">Slippage (pips)</Label>
              <Input
                id="slippage"
                type="number"
                step="0.1"
                value={strategy.slippage}
                onChange={(e) => setStrategy({...strategy, slippage: Number(e.target.value)})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <Separator className="bg-slate-600" />

            <div className="space-y-3">
              <Button
                onClick={runBacktest}
                disabled={isRunning}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Running Backtest...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Backtest
                  </>
                )}
              </Button>
              <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                <Save className="h-4 w-4 mr-2" />
                Save Strategy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StrategyBuilder;
