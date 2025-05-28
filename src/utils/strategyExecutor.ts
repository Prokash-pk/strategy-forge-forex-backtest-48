
interface StrategySignals {
  entry: boolean[];
  exit: boolean[];
  indicators?: Record<string, number[]>;
}

interface MarketData {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

// Technical Analysis Functions
export class TechnicalAnalysis {
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
    
    return [NaN, ...result]; // Add NaN at the beginning to match original data length
  }

  static macd(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const emaFast = this.ema(data, fastPeriod);
    const emaSlow = this.ema(data, slowPeriod);
    const macdLine = emaFast.map((fast, i) => fast - emaSlow[i]);
    const signalLine = this.ema(macdLine.filter(val => !isNaN(val)), signalPeriod);
    
    // Pad signal line to match macd line length
    const paddedSignal = new Array(macdLine.length - signalLine.length).fill(NaN).concat(signalLine);
    
    return {
      macd: macdLine,
      signal: paddedSignal,
      histogram: macdLine.map((macd, i) => macd - (paddedSignal[i] || 0))
    };
  }

  static bollingerBands(data: number[], period: number = 20, stdDev: number = 2) {
    const sma = this.sma(data, period);
    const result = { upper: [], middle: sma, lower: [] };

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.upper.push(NaN);
        result.lower.push(NaN);
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const mean = sma[i];
        const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
        const std = Math.sqrt(variance);
        
        result.upper.push(mean + (std * stdDev));
        result.lower.push(mean - (std * stdDev));
      }
    }

    return result;
  }
}

export class StrategyExecutor {
  private static parseStrategyCode(code: string): string {
    // Convert Python pandas syntax to JavaScript
    let jsCode = code
      // Replace pandas methods
      .replace(/data\['Close'\]\.ewm\(span=(\d+)\)\.mean\(\)/g, 'TechnicalAnalysis.ema(data.close, $1)')
      .replace(/data\['Close'\]\.rolling\((\d+)\)\.mean\(\)/g, 'TechnicalAnalysis.sma(data.close, $1)')
      .replace(/data\['High'\]/g, 'data.high')
      .replace(/data\['Low'\]/g, 'data.low')
      .replace(/data\['Open'\]/g, 'data.open')
      .replace(/data\['Close'\]/g, 'data.close')
      .replace(/data\['Volume'\]/g, 'data.volume')
      
      // Replace common Python operators
      .replace(/&/g, '&&')
      .replace(/\|/g, '||')
      .replace(/\.shift\((\d+)\)/g, '.slice(0, -$1).concat(new Array($1).fill(NaN))')
      
      // Replace pandas comparison methods
      .replace(/(\w+) > (\w+)/g, '$1.map((val, i) => val > $2[i])')
      .replace(/(\w+) < (\w+)/g, '$1.map((val, i) => val < $2[i])')
      .replace(/(\w+) >= (\w+)/g, '$1.map((val, i) => val >= $2[i])')
      .replace(/(\w+) <= (\w+)/g, '$1.map((val, i) => val <= $2[i])');

    return jsCode;
  }

  static executeStrategy(code: string, marketData: MarketData): StrategySignals {
    try {
      console.log('Executing strategy code:', code);
      
      // Create a safe execution context
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
      } else if (code.toLowerCase().includes('macd')) {
        return this.executeMACDStrategy(data);
      } else if (code.toLowerCase().includes('bollinger')) {
        return this.executeBollingerStrategy(data);
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

  private static executeEMACrossover(data: MarketData): StrategySignals {
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

    return {
      entry,
      exit,
      indicators: { ema12, ema26 }
    };
  }

  private static executeRSIStrategy(data: MarketData): StrategySignals {
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

    return {
      entry,
      exit,
      indicators: { rsi }
    };
  }

  private static executeMACDStrategy(data: MarketData): StrategySignals {
    const macdData = TechnicalAnalysis.macd(data.close);
    const entry: boolean[] = [];
    const exit: boolean[] = [];

    for (let i = 0; i < data.close.length; i++) {
      if (i === 0) {
        entry.push(false);
        exit.push(false);
      } else {
        // Entry: MACD crosses above signal line
        const entrySignal = macdData.macd[i] > macdData.signal[i] && 
                           macdData.macd[i-1] <= macdData.signal[i-1];
        // Exit: MACD crosses below signal line
        const exitSignal = macdData.macd[i] < macdData.signal[i] && 
                          macdData.macd[i-1] >= macdData.signal[i-1];
        
        entry.push(entrySignal);
        exit.push(exitSignal);
      }
    }

    return {
      entry,
      exit,
      indicators: { 
        macd: macdData.macd, 
        signal: macdData.signal, 
        histogram: macdData.histogram 
      }
    };
  }

  private static executeBollingerStrategy(data: MarketData): StrategySignals {
    const bb = TechnicalAnalysis.bollingerBands(data.close);
    const entry: boolean[] = [];
    const exit: boolean[] = [];

    for (let i = 0; i < data.close.length; i++) {
      // Entry: Price touches lower band (oversold)
      const entrySignal = data.close[i] <= bb.lower[i];
      // Exit: Price touches upper band (overbought)
      const exitSignal = data.close[i] >= bb.upper[i];
      
      entry.push(entrySignal);
      exit.push(exitSignal);
    }

    return {
      entry,
      exit,
      indicators: { 
        bb_upper: bb.upper, 
        bb_middle: bb.middle, 
        bb_lower: bb.lower 
      }
    };
  }

  private static executeCustomStrategy(code: string, data: MarketData): StrategySignals {
    // For now, implement a simple pattern matching approach
    // This could be expanded to use a proper Python-to-JS transpiler
    
    // Create default signals
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
      
      return {
        entry,
        exit,
        indicators: { ma }
      };
    }
    
    // Fallback to EMA crossover
    return this.executeEMACrossover(data);
  }
}
