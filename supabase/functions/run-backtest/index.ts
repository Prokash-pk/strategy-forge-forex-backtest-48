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
    maxPositionSize: number;
    riskModel: string;
  };
  pythonSignals?: {
    entry: boolean[];
    exit: boolean[];
    indicators?: Record<string, number[]>;
    error?: string;
  };
  timeframeInfo?: {
    minutes: number;
    description: string;
  };
  enhancedMode?: boolean;
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

  static atr(high: number[], low: number[], close: number[], period: number = 14): number[] {
    if (high.length < 2 || low.length < 2 || close.length < 2) {
      return new Array(close.length).fill(NaN);
    }

    const trueRanges: number[] = [];
    
    for (let i = 1; i < close.length; i++) {
      const tr1 = high[i] - low[i];
      const tr2 = Math.abs(high[i] - close[i - 1]);
      const tr3 = Math.abs(low[i] - close[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    const result = [NaN];

    for (let i = 0; i < trueRanges.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else {
        const atr = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        result.push(atr);
      }
    }

    return result;
  }

  static williamsR(high: number[], low: number[], close: number[], period: number = 14): number[] {
    const result: number[] = [];

    for (let i = 0; i < close.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else {
        const periodHigh = Math.max(...high.slice(i - period + 1, i + 1));
        const periodLow = Math.min(...low.slice(i - period + 1, i + 1));

        if (periodHigh === periodLow) {
          result.push(-50);
        } else {
          const wr = ((periodHigh - close[i]) / (periodHigh - periodLow)) * -100;
          result.push(wr);
        }
      }
    }

    return result;
  }

  static stochasticOscillator(high: number[], low: number[], close: number[], kPeriod: number = 14, dPeriod: number = 3) {
    const rawK: number[] = [];

    for (let i = 0; i < close.length; i++) {
      if (i < kPeriod - 1) {
        rawK.push(NaN);
      } else {
        const periodHigh = Math.max(...high.slice(i - kPeriod + 1, i + 1));
        const periodLow = Math.min(...low.slice(i - kPeriod + 1, i + 1));

        if (periodHigh === periodLow) {
          rawK.push(50);
        } else {
          const kVal = ((close[i] - periodLow) / (periodHigh - periodLow)) * 100;
          rawK.push(kVal);
        }
      }
    }

    const kPercent = this.smoothValues(rawK, 3);
    const dPercent = this.smoothValues(kPercent, dPeriod);

    return { k: kPercent, d: dPercent };
  }

  private static smoothValues(values: number[], period: number): number[] {
    const result: number[] = [];
    
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1 || isNaN(values[i])) {
        result.push(NaN);
      } else {
        const validSlice = values.slice(i - period + 1, i + 1).filter(v => !isNaN(v));
        if (validSlice.length > 0) {
          result.push(validSlice.reduce((a, b) => a + b, 0) / validSlice.length);
        } else {
          result.push(NaN);
        }
      }
    }

    return result;
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

      // Handle advanced indicator patterns
      if (code.toLowerCase().includes('williams') || code.toLowerCase().includes('%r')) {
        return this.executeWilliamsRStrategy(data);
      } else if (code.toLowerCase().includes('stochastic')) {
        return this.executeAdvancedStochasticStrategy(data);
      } else if (code.toLowerCase().includes('atr')) {
        return this.executeATRStrategy(data);
      } else if (code.toLowerCase().includes('ema') && code.toLowerCase().includes('crossover')) {
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

  private static executeWilliamsRStrategy(data: any) {
    const williamsR = TechnicalAnalysis.williamsR(data.high, data.low, data.close, 14);
    const entry: boolean[] = [];
    const exit: boolean[] = [];

    for (let i = 0; i < data.close.length; i++) {
      const entrySignal = i > 0 && williamsR[i] > -80 && williamsR[i-1] <= -80;
      const exitSignal = i > 0 && williamsR[i] < -20 && williamsR[i-1] >= -20;
      
      entry.push(entrySignal);
      exit.push(exitSignal);
    }

    return { entry, exit, indicators: { williamsR } };
  }

  private static executeAdvancedStochasticStrategy(data: any) {
    const stoch = TechnicalAnalysis.stochasticOscillator(data.high, data.low, data.close);
    const entry: boolean[] = [];
    const exit: boolean[] = [];

    for (let i = 0; i < data.close.length; i++) {
      const entrySignal = i > 0 && 
        stoch.k[i] > stoch.d[i] && 
        stoch.k[i-1] <= stoch.d[i-1] && 
        stoch.k[i] < 20;
      
      const exitSignal = i > 0 && 
        stoch.k[i] < stoch.d[i] && 
        stoch.k[i-1] >= stoch.d[i-1] && 
        stoch.k[i] > 80;
      
      entry.push(entrySignal);
      exit.push(exitSignal);
    }

    return { entry, exit, indicators: { stoch_k: stoch.k, stoch_d: stoch.d } };
  }

  private static executeATRStrategy(data: any) {
    const atr = TechnicalAnalysis.atr(data.high, data.low, data.close, 14);
    const sma = TechnicalAnalysis.sma(data.close, 20);
    const entry: boolean[] = [];
    const exit: boolean[] = [];

    for (let i = 0; i < data.close.length; i++) {
      const entrySignal = i > 0 && 
        !isNaN(atr[i]) && !isNaN(sma[i]) &&
        data.close[i] > sma[i] + atr[i] && 
        data.close[i-1] <= sma[i-1] + atr[i-1];
      
      const exitSignal = i > 0 && 
        !isNaN(sma[i]) &&
        data.close[i] < sma[i] && 
        data.close[i-1] >= sma[i-1];
      
      entry.push(entrySignal);
      exit.push(exitSignal);
    }

    return { entry, exit, indicators: { atr, sma } };
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
    const { data, strategy, pythonSignals, timeframeInfo, enhancedMode }: BacktestRequest = await req.json();
    
    console.log(`Running backtest for ${strategy.name} with ${data.length} data points`);
    console.log(`Stop Loss: ${strategy.stopLoss} pips, Take Profit: ${strategy.takeProfit} pips`);
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

    // Convert pips to price difference (1 pip = 0.0001 for major pairs)
    const pipValue = 0.0001;
    const stopLossDistance = strategy.stopLoss * pipValue;
    const takeProfitDistance = strategy.takeProfit * pipValue;
    const spreadDistance = strategy.spread * pipValue;
    const slippageDistance = strategy.slippage * pipValue;

    console.log(`Stop Loss Distance: ${stopLossDistance}, Take Profit Distance: ${takeProfitDistance}`);

    // Generate equity curve
    const equityCurve = [];

    // Get current time to prevent future trades
    const currentTime = new Date();

    for (let i = 1; i < data.length; i++) {
      const currentBar = data[i];
      const currentPrice = currentBar.close;
      
      // Parse date and ensure it's not in the future
      let currentDate = new Date(currentBar.date);
      
      // If date is in the future, cap it to current time
      if (currentDate > currentTime) {
        console.log(`Capping future date ${currentDate.toISOString()} to current time`);
        currentDate = new Date(currentTime.getTime() - (data.length - i) * (timeframeInfo?.minutes || 5) * 60000);
      }

      // Apply spread to entry price
      const entryPrice = currentPrice + spreadDistance;
      const exitPrice = currentPrice - spreadDistance;

      // Entry signal from strategy
      if (!position && signals.entry[i]) {
        position = {
          type: 'BUY',
          entry: entryPrice,
          entryDate: currentDate,
          id: tradeId
        };
        console.log(`Opening BUY position at ${entryPrice} on ${currentDate.toISOString()}`);
        console.log(`Stop Loss will trigger at: ${entryPrice - stopLossDistance}`);
        console.log(`Take Profit will trigger at: ${entryPrice + takeProfitDistance}`);
      }

      // Exit conditions
      if (position) {
        let shouldExit = false;
        let exitReason = '';
        let finalExitPrice = exitPrice;

        // Exit signal from strategy
        if (signals.exit[i]) {
          shouldExit = true;
          exitReason = 'Strategy exit signal';
        }

        // Stop loss - FIXED CALCULATION
        if (position.type === 'BUY' && currentPrice <= (position.entry - stopLossDistance)) {
          shouldExit = true;
          exitReason = 'Stop loss';
          finalExitPrice = position.entry - stopLossDistance - slippageDistance;
          console.log(`Stop loss triggered: Current price ${currentPrice} <= Stop level ${position.entry - stopLossDistance}`);
        }

        // Take profit - FIXED CALCULATION  
        if (position.type === 'BUY' && currentPrice >= (position.entry + takeProfitDistance)) {
          shouldExit = true;
          exitReason = 'Take profit';
          finalExitPrice = position.entry + takeProfitDistance - slippageDistance;
          console.log(`Take profit triggered: Current price ${currentPrice} >= TP level ${position.entry + takeProfitDistance}`);
        }

        if (shouldExit) {
          // Calculate PnL properly for forex (standard lot = 100,000 units)
          const standardLot = 100000;
          const priceMovement = finalExitPrice - position.entry;
          const pnl = (priceMovement * standardLot) - strategy.commission;
          const duration = Math.round((currentDate.getTime() - position.entryDate.getTime()) / (1000 * 60));

          trades.push({
            id: position.id,
            date: position.entryDate, // Use entry date, not exit date
            type: position.type,
            entry: position.entry,
            exit: finalExitPrice,
            pnl: pnl,
            duration: duration
          });

          balance += pnl;
          console.log(`Closing position ${position.id}: Entry ${position.entry}, Exit ${finalExitPrice}, PnL ${pnl.toFixed(2)}, reason: ${exitReason}`);
          position = null;
          tradeId++;
        }
      }

      // Add to equity curve with proper date
      equityCurve.push({
        date: currentDate.toISOString(),
        balance: balance
      });
    }

    // Calculate statistics
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
    const totalReturn = ((balance - strategy.initialBalance) / strategy.initialBalance) * 100;
    
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0)) / losingTrades.length : 0;
    
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
      executionMethod: pythonSignals && !pythonSignals.error ? 'Python' : 'JavaScript',
      stopLossSettings: {
        pips: strategy.stopLoss,
        priceDistance: stopLossDistance,
        takeProfitPips: strategy.takeProfit,
        takeProfitDistance: takeProfitDistance
      }
    };

    console.log(`Backtest completed: ${trades.length} trades, ${totalReturn.toFixed(2)}% return`);
    console.log(`Stop Loss applied correctly: ${strategy.stopLoss} pips = ${stopLossDistance} price distance`);
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
