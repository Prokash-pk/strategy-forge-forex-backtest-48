
export class EnhancedTechnicalAnalysis {
  // Trend Detection
  static detectTrend(prices: number[], shortPeriod: number = 21, longPeriod: number = 55): ('uptrend' | 'downtrend' | 'sideways')[] {
    const shortEMA = this.ema(prices, shortPeriod);
    const longEMA = this.ema(prices, longPeriod);
    const atr = this.atr(prices, prices, prices, 14); // Simplified for trend detection
    
    return prices.map((_, i) => {
      if (i < longPeriod) return 'sideways';
      
      const trendStrength = Math.abs(shortEMA[i] - longEMA[i]) / longEMA[i];
      const minTrendStrength = 0.001; // 0.1% minimum trend strength
      
      if (trendStrength < minTrendStrength) return 'sideways';
      
      return shortEMA[i] > longEMA[i] ? 'uptrend' : 'downtrend';
    });
  }

  // Volatility Filter
  static getVolatilityFilter(high: number[], low: number[], close: number[], period: number = 14): boolean[] {
    const atr = this.atr(high, low, close, period);
    const atrSMA = this.sma(atr.filter(x => !isNaN(x)), 20);
    
    return atr.map((currentATR, i) => {
      if (isNaN(currentATR) || i < 20) return false;
      const avgATR = atrSMA[Math.min(i - period + 1, atrSMA.length - 1)] || currentATR;
      return currentATR > avgATR * 1.2; // High volatility periods only
    });
  }

  // Market Session Filter (assuming 5-minute bars)
  static getSessionFilter(timestamps: Date[]): boolean[] {
    return timestamps.map(date => {
      const hour = date.getUTCHours();
      // Active trading sessions: London (8-12 UTC) and New York (13-17 UTC)
      return (hour >= 8 && hour <= 12) || (hour >= 13 && hour <= 17);
    });
  }

  // Support/Resistance Levels
  static findSupportResistance(highs: number[], lows: number[], lookback: number = 20): { supports: number[], resistances: number[] } {
    const supports: number[] = [];
    const resistances: number[] = [];
    
    for (let i = lookback; i < highs.length - lookback; i++) {
      // Find local highs (resistance)
      let isLocalHigh = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && highs[j] >= highs[i]) {
          isLocalHigh = false;
          break;
        }
      }
      if (isLocalHigh) resistances.push(highs[i]);
      
      // Find local lows (support)
      let isLocalLow = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && lows[j] <= lows[i]) {
          isLocalLow = false;
          break;
        }
      }
      if (isLocalLow) supports.push(lows[i]);
    }
    
    return { supports, resistances };
  }

  // Enhanced Signal Quality Score
  static getSignalQuality(
    price: number,
    trend: 'uptrend' | 'downtrend' | 'sideways',
    isHighVolatility: boolean,
    isActiveSession: boolean,
    rsi: number,
    macdHistogram: number
  ): number {
    let score = 0;
    
    // Trend alignment (40% weight)
    if (trend !== 'sideways') score += 40;
    
    // Volatility (20% weight)
    if (isHighVolatility) score += 20;
    
    // Session timing (20% weight)
    if (isActiveSession) score += 20;
    
    // RSI confirmation (10% weight)
    if ((trend === 'uptrend' && rsi < 70 && rsi > 40) || 
        (trend === 'downtrend' && rsi > 30 && rsi < 60)) {
      score += 10;
    }
    
    // MACD momentum (10% weight)
    if ((trend === 'uptrend' && macdHistogram > 0) || 
        (trend === 'downtrend' && macdHistogram < 0)) {
      score += 10;
    }
    
    return score;
  }

  // Basic technical indicators (reuse existing implementations)
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
    if (!data.length) return [];
    const result = [data[0]];
    const multiplier = 2 / (period + 1);
    
    for (let i = 1; i < data.length; i++) {
      const ema = (data[i] * multiplier) + (result[i-1] * (1 - multiplier));
      result.push(ema);
    }
    return result;
  }

  static atr(high: number[], low: number[], close: number[], period: number): number[] {
    if (high.length < 2) return new Array(close.length).fill(NaN);
    
    const trueRanges: number[] = [NaN];
    for (let i = 1; i < close.length; i++) {
      const tr1 = high[i] - low[i];
      const tr2 = Math.abs(high[i] - close[i - 1]);
      const tr3 = Math.abs(low[i] - close[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    return this.sma(trueRanges, period);
  }
}
