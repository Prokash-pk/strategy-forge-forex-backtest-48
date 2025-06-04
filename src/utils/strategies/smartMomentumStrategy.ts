
import { TechnicalAnalysis } from '../technical/TechnicalAnalysis';
import { AdvancedTechnicalAnalysis } from '../advancedTechnicalAnalysis';
import { StrategySignals, MarketData } from '../types/strategyTypes';

export class SmartMomentumStrategy {
  static execute(data: MarketData, reverseSignals: boolean = false): StrategySignals {
    const close = data.close;
    const high = data.high;
    const low = data.low;
    
    // Calculate technical indicators
    const shortEma = TechnicalAnalysis.ema(close, 21);
    const longEma = TechnicalAnalysis.ema(close, 55);
    const dailyEma = TechnicalAnalysis.ema(close, 200);
    const rsi = TechnicalAnalysis.rsi(close, 14);
    const atr = AdvancedTechnicalAnalysis.atr(high, low, close, 14);
    const avgAtr = TechnicalAnalysis.sma(atr, 20);
    
    const entry: boolean[] = [];
    const exit: boolean[] = [];
    const tradeDirection: string[] = [];
    
    for (let i = 0; i < close.length; i++) {
      if (i < 200) {
        entry.push(false);
        exit.push(false);
        tradeDirection.push('NONE');
      } else {
        // Higher timeframe trend filter
        const weeklyTrendUp = close[i] > dailyEma[i];
        const weeklyTrendDown = close[i] < dailyEma[i];
        
        // Volatility filter - only trade during high volatility
        const highVolatility = atr[i] > avgAtr[i] * 1.2;
        
        // Enhanced momentum conditions
        const trendUp = shortEma[i] > longEma[i] && shortEma[i-1] > shortEma[i-5];
        const trendDown = shortEma[i] < longEma[i] && shortEma[i-1] < shortEma[i-5];
        const momentumStrongUp = close[i] > shortEma[i] * 1.001;
        const momentumStrongDown = close[i] < shortEma[i] * 0.999;
        const rsiGoodLong = 45 < rsi[i] && rsi[i] < 75;
        const rsiGoodShort = 25 < rsi[i] && rsi[i] < 55;
        
        // LONG ENTRY CONDITIONS
        const longEntryConditions = (trendUp && 
                                   momentumStrongUp && 
                                   rsiGoodLong &&
                                   weeklyTrendUp &&
                                   highVolatility);
        
        // SHORT ENTRY CONDITIONS
        const shortEntryConditions = (trendDown && 
                                    momentumStrongDown && 
                                    rsiGoodShort &&
                                    weeklyTrendDown &&
                                    highVolatility);
        
        // Apply reverse signals if enabled
        let actualLong, actualShort;
        if (reverseSignals) {
          actualLong = shortEntryConditions;
          actualShort = longEntryConditions;
        } else {
          actualLong = longEntryConditions;
          actualShort = shortEntryConditions;
        }
        
        // Determine entry signal and direction
        if (actualLong) {
          entry.push(true);
          tradeDirection.push('BUY');
        } else if (actualShort) {
          entry.push(true);
          tradeDirection.push('SELL');
        } else {
          entry.push(false);
          tradeDirection.push('NONE');
        }
        
        // Conservative exit conditions
        const exitSignal = (rsi[i] > 80 || rsi[i] < 20 || !highVolatility);
        exit.push(exitSignal);
      }
    }
    
    return {
      entry,
      exit,
      tradeDirection,
      indicators: {
        shortEma,
        longEma,
        dailyEma,
        rsi,
        atr,
        avgAtr
      }
    };
  }
}
