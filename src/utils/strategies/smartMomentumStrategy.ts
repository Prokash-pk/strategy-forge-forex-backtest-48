
import { TechnicalAnalysis } from '../technical/TechnicalAnalysis';
import { StrategySignals, MarketData } from '../types/strategyTypes';

export class SmartMomentumStrategy {
  static execute(data: MarketData): StrategySignals {
    const close = data.close;
    const high = data.high;
    const low = data.low;
    
    // Calculate technical indicators
    const shortEma = TechnicalAnalysis.ema(close, 21);
    const longEma = TechnicalAnalysis.ema(close, 55);
    const dailyEma = TechnicalAnalysis.ema(close, 200);
    const rsi = TechnicalAnalysis.rsi(close, 14);
    
    const entry: boolean[] = [];
    const exit: boolean[] = [];
    
    for (let i = 0; i < close.length; i++) {
      if (i < 200) {
        entry.push(false);
        exit.push(false);
      } else {
        // Trend conditions
        const weeklyTrendUp = close[i] > dailyEma[i];
        const trendUp = shortEma[i] > longEma[i] && shortEma[i-1] > shortEma[i-5];
        const momentumStrongUp = close[i] > shortEma[i] * 1.001;
        const rsiGoodLong = rsi[i] > 45 && rsi[i] < 75;
        
        // Entry conditions
        const longEntry = trendUp && momentumStrongUp && rsiGoodLong && weeklyTrendUp;
        
        entry.push(longEntry);
        
        // Exit conditions
        const exitSignal = rsi[i] > 80 || rsi[i] < 20;
        exit.push(exitSignal);
      }
    }
    
    return {
      entry,
      exit,
      indicators: {
        shortEma,
        longEma,
        dailyEma,
        rsi
      }
    };
  }
}
