
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BacktestRequest {
  data: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  strategy: {
    code: string;
    name: string;
    initialBalance: number;
    riskPerTrade: number;
    stopLoss: number;
    takeProfit: number;
    spread: number;
    commission: number;
    slippage: number;
  };
}

interface Trade {
  id: number;
  date: Date;
  type: 'BUY' | 'SELL';
  entry: number;
  exit: number;
  pnl: number;
  duration: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, strategy }: BacktestRequest = await req.json();
    
    console.log(`Running backtest for ${strategy.name} with ${data.length} data points`);

    // Simulate strategy execution - this is a simplified version
    // In a real implementation, you'd want to use a Python interpreter or similar
    const trades: Trade[] = [];
    let balance = strategy.initialBalance;
    let position: { type: 'BUY' | 'SELL'; entry: number; entryDate: Date; id: number } | null = null;
    let tradeId = 1;

    // Calculate simple EMA crossover for demonstration
    const calculateEMA = (prices: number[], period: number) => {
      const ema = [];
      const multiplier = 2 / (period + 1);
      
      for (let i = 0; i < prices.length; i++) {
        if (i === 0) {
          ema.push(prices[i]);
        } else {
          ema.push((prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
        }
      }
      return ema;
    };

    const closes = data.map(d => d.close);
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);

    // Generate equity curve
    const equityCurve = [];

    for (let i = 26; i < data.length; i++) {
      const currentBar = data[i];
      const currentPrice = currentBar.close;
      const currentDate = new Date(currentBar.date);

      // Apply spread to entry price
      const entryPrice = currentPrice + (strategy.spread / 10000);
      const exitPrice = currentPrice - (strategy.spread / 10000);

      // Entry signal: EMA12 crosses above EMA26
      if (!position && i > 0 && ema12[i] > ema26[i] && ema12[i-1] <= ema26[i-1]) {
        position = {
          type: 'BUY',
          entry: entryPrice,
          entryDate: currentDate,
          id: tradeId
        };
        console.log(`Opening BUY position at ${entryPrice} on ${currentDate.toISOString()}`);
      }

      // Exit conditions
      if (position) {
        let shouldExit = false;
        let exitReason = '';

        // Exit signal: EMA12 crosses below EMA26
        if (ema12[i] < ema26[i] && ema12[i-1] >= ema26[i-1]) {
          shouldExit = true;
          exitReason = 'Signal exit';
        }

        // Stop loss
        if (position.type === 'BUY' && currentPrice <= position.entry - (strategy.stopLoss / 10000)) {
          shouldExit = true;
          exitReason = 'Stop loss';
        }

        // Take profit
        if (position.type === 'BUY' && currentPrice >= position.entry + (strategy.takeProfit / 10000)) {
          shouldExit = true;
          exitReason = 'Take profit';
        }

        if (shouldExit) {
          const finalExitPrice = exitPrice - (strategy.slippage / 10000);
          const pnl = (finalExitPrice - position.entry) * 100000 - strategy.commission; // Standard lot calculation
          const duration = Math.round((currentDate.getTime() - position.entryDate.getTime()) / (1000 * 60)); // Duration in minutes

          trades.push({
            id: position.id,
            date: position.entryDate,
            type: position.type,
            entry: position.entry,
            exit: finalExitPrice,
            pnl: pnl,
            duration: duration
          });

          balance += pnl;
          console.log(`Closing position ${position.id}: PnL ${pnl.toFixed(2)}, reason: ${exitReason}`);
          position = null;
          tradeId++;
        }
      }

      // Add to equity curve
      equityCurve.push({
        date: currentBar.date,
        balance: balance
      });
    }

    // Calculate statistics
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
    const totalReturn = ((balance - strategy.initialBalance) / strategy.initialBalance) * 100;
    
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + Math.abs(t.pnl), 0) / losingTrades.length : 0;
    
    const profitFactor = losingTrades.length > 0 && avgLoss > 0 ? 
      (winningTrades.length * avgWin) / (losingTrades.length * avgLoss) : 
      winningTrades.length > 0 ? 5.0 : 0;

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = strategy.initialBalance;
    for (const point of equityCurve) {
      if (point.balance > peak) peak = point.balance;
      const drawdown = ((peak - point.balance) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    const sharpeRatio = totalReturn > 0 ? totalReturn / Math.max(maxDrawdown, 1) : 0;

    const results = {
      strategy: strategy.name,
      symbol: 'Real Data',
      timeframe: 'Live Data',
      period: `${data.length} bars`,
      initialBalance: strategy.initialBalance,
      finalBalance: Math.round(balance * 100) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: Math.round(winRate * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      equityCurve,
      trades
    };

    console.log(`Backtest completed: ${trades.length} trades, ${totalReturn.toFixed(2)}% return`);

    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in run-backtest:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Backtest execution failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
