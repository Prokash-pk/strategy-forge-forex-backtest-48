
// Advanced Technical Analysis Functions for JavaScript fallback
export class AdvancedTechnicalAnalysis {
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

    const result = [NaN]; // First value is always NaN

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

  static stochasticOscillator(
    high: number[], 
    low: number[], 
    close: number[], 
    kPeriod: number = 14, 
    dPeriod: number = 3, 
    smoothK: number = 3
  ) {
    // Calculate raw %K
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

    // Smooth %K
    const kPercent = this.smoothValues(rawK, smoothK);
    
    // Calculate %D
    const dPercent = this.smoothValues(kPercent, dPeriod);

    return { k: kPercent, d: dPercent };
  }

  static commodityChannelIndex(high: number[], low: number[], close: number[], period: number = 20): number[] {
    const result: number[] = [];
    
    // Calculate typical prices
    const typicalPrices = close.map((c, i) => (high[i] + low[i] + c) / 3);

    for (let i = 0; i < typicalPrices.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else {
        const slice = typicalPrices.slice(i - period + 1, i + 1);
        const smaTp = slice.reduce((a, b) => a + b, 0) / period;
        
        const meanDeviation = slice.reduce((sum, tp) => sum + Math.abs(tp - smaTp), 0) / period;
        
        if (meanDeviation === 0) {
          result.push(0);
        } else {
          const cci = (typicalPrices[i] - smaTp) / (0.015 * meanDeviation);
          result.push(cci);
        }
      }
    }

    return result;
  }

  private static smoothValues(values: number[], period: number): number[] {
    const result: number[] = [];
    const validValues: number[] = [];

    for (let i = 0; i < values.length; i++) {
      if (!isNaN(values[i])) {
        validValues.push(values[i]);
      }

      if (i < period - 1 || validValues.length < period) {
        result.push(NaN);
      } else {
        const smoothVal = validValues.slice(-period).reduce((a, b) => a + b, 0) / period;
        result.push(smoothVal);
      }
    }

    return result;
  }
}
