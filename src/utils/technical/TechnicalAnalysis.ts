
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
    
    return [NaN, ...result];
  }

  static macd(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const emaFast = this.ema(data, fastPeriod);
    const emaSlow = this.ema(data, slowPeriod);
    const macdLine = emaFast.map((fast, i) => fast - emaSlow[i]);
    const signalLine = this.ema(macdLine.filter(val => !isNaN(val)), signalPeriod);
    
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
