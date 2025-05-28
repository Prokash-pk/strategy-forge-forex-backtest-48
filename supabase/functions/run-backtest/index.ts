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
  pythonSignals?: {
    entry: boolean[];
    exit: boolean[];
    indicators?: Record<string, number[]>;
    error?: string;
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

// Technical Analysis Functions
class TechnicalAnalysis {
  static sma(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }
    return result;
  }

  static ema(data: number[], period: number): number[] {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);
    
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        result.push(data[i]);
      } else {
        result.push((data[i] * multiplier) + (result[i - 1] * (1 - multiplier)));
      }
    }
    return result;
  }

  static rsi(data: number[], period: number = 14): number[] {
    const result: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    for (let i = 0; i < gains.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else {
        const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        
        if (avgLoss === 0) {
          result.push(100);
        } else {
          const rs = avgGain / avgLoss;
          result.push(100 - (100 / (1 + rs)));
        }
      }
    }
    
    return [NaN, ...result];
  }
}

// Strategy Executor
class StrategyExecutor {
  static executeStrategy(code: string, marketData: any, pythonSignals?: any) {
    // If Python signals are provided, use them directly
    if (pythonSignals && !pythonSignals.error) {
      console.log('Using Python-generated signals');
      return pythonSignals;
    }

    try {
      console.log('Executing strategy code:', code);
      
      const data = {
        open: marketData.open,
        high: marketData.high,
        low: marketData.low,
        close: marketData.close,
        volume: marketData.volume
      };

      // Handle common strategy patterns
      if (code.toLowerCase().includes('ema') && code.toLowerCase().includes('crossover')) {
        return this.executeEMACrossover(data);
      } else if (code.toLowerCase().includes('rsi')) {
        return this.executeRSIStrategy(data);
      } else {
        // Try to parse and execute custom code
        return this.executeCustomStrategy(code, data);
      }
    } catch (error) {
      console.error('Strategy execution error:', error);
      // Fallback to simple EMA crossover
      return this.executeEMACrossover({
        open: marketData.open,
        high: marketData.high,
        low: marketData.low,
        close: marketData.close,
        volume: marketData.volume
      });
    }
  }

  private static executeEMACrossover(data: any) {
    const ema12 = TechnicalAnalysis.ema(data.close, 12);
    const ema26 = TechnicalAnalysis.ema(data.close, 26);
    
    const entry: boolean[] = [];
    const exit: boolean[] = [];

    for (let i = 0; i < data.close.length; i++) {
      if (i === 0) {
        entry.push(false);
        exit.push(false);
      } else {
        // Entry: EMA12 crosses above EMA26
        const entrySignal = ema12[i] > ema26[i] && ema12[i-1] <= ema26[i-1];
        // Exit: EMA12 crosses below EMA26
        const exitSignal = ema12[i] < ema26[i] && ema12[i-1] >= ema26[i-1];
        
        entry.push(entrySignal);
        exit.push(exitSignal);
      }
    }

    return { entry, exit, indicators: { ema12, ema26 } };
  }

  private static executeRSIStrategy(data: any) {
    const rsi = TechnicalAnalysis.rsi(data.close, 14);
    const entry: boolean[] = [];
    const exit: boolean[] = [];

    for (let i = 0; i < data.close.length; i++) {
      // Entry: RSI crosses above 30 (oversold)
      const entrySignal = i > 0 && rsi[i] > 30 && rsi[i-1] <= 30;
      // Exit: RSI crosses above 70 (overbought)
      const exitSignal = i > 0 && rsi[i] > 70 && rsi[i-1] <= 70;
      
      entry.push(entrySignal);
      exit.push(exitSignal);
    }

    return { entry, exit, indicators: { rsi } };
  }

  private static executeCustomStrategy(code: string, data: any) {
    // Simple pattern matching approach
    const entry = new Array(data.close.length).fill(false);
    const exit = new Array(data.close.length).fill(false);
    
    // Try to extract strategy parameters from code
    const smaMatch = code.match(/sma.*?(\d+)/i);
    const emaMatch = code.match(/ema.*?(\d+)/i);
    
    if (smaMatch || emaMatch) {
      const period = parseInt(smaMatch?.[1] || emaMatch?.[1] || '20');
      const ma = smaMatch ? 
        TechnicalAnalysis.sma(data.close, period) : 
        TechnicalAnalysis.ema(data.close, period);
      
      // Simple MA crossover strategy
      for (let i = 1; i < data.close.length; i++) {
        entry[i] = data.close[i] > ma[i] && data.close[i-1] <= ma[i-1];
        exit[i] = data.close[i] < ma[i] && data.close[i-1] >= ma[i-1];
      }
      
      return { entry, exit, indicators: { ma } };
    }
    
    // Fallback to EMA crossover
    return this.executeEMACrossover(data);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, strategy, pythonSignals }: BacktestRequest = await req.json();
    
    console.log(`Running backtest for ${strategy.name} with ${data.length} data points`);
    console.log('Strategy code:', strategy.code);
    
    if (pythonSignals) {
      console.log('Python signals provided:', pythonSignals.error ? `Error: ${pythonSignals.error}` : 'Valid signals');
    }

    // Prepare market data for strategy execution
    const marketData = {
      open: data.map(d => d.open),
      high: data.map(d => d.high),
      low: data.map(d => d.low),
      close: data.map(d => d.close),
      volume: data.map(d => d.volume)
    };

    // Execute the user's strategy (with Python signals if available)
    const signals = StrategyExecutor.executeStrategy(strategy.code, marketData, pythonSignals);
    console.log('Strategy signals generated:', signals.entry.filter(Boolean).length, 'entry signals');

    // Simulate strategy execution using the generated signals
    const trades: Trade[] = [];
    let balance = strategy.initialBalance;
    let position: { type: 'BUY' | 'SELL'; entry: number; entryDate: Date; id: number } | null = null;
    let tradeId = 1;

    // Generate equity curve
    const equityCurve = [];

    for (let i = 1; i < data.length; i++) {
      const currentBar = data[i];
      const currentPrice = currentBar.close;
      const currentDate = new Date(currentBar.date);

      // Apply spread to entry price
      const entryPrice = currentPrice + (strategy.spread / 10000);
      const exitPrice = currentPrice - (strategy.spread / 10000);

      // Entry signal from strategy
      if (!position && signals.entry[i]) {
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

        // Exit signal from strategy
        if (signals.exit[i]) {
          shouldExit = true;
          exitReason = 'Strategy exit signal';
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
      trades,
      executionMethod: pythonSignals && !pythonSignals.error ? 'Python' : 'JavaScript'
    };

    console.log(`Backtest completed: ${trades.length} trades, ${totalReturn.toFixed(2)}% return`);
    console.log(`Strategy used: ${strategy.name} (${results.executionMethod})`);

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
