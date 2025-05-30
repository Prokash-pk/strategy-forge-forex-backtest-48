
import { TechnicalAnalysis } from '../technical/TechnicalAnalysis';
import { StrategySignals, MarketData } from '../types/strategyTypes';

export class MACDStrategy {
  static execute(data: MarketData): StrategySignals {
    const macdData = TechnicalAnalysis.macd(data.close);
    const entry: boolean[] = [];
    const exit: boolean[] = [];

    for (let i = 0; i < data.close.length; i++) {
      if (i === 0) {
        entry.push(false);
        exit.push(false);
      } else {
        const entrySignal = macdData.macd[i] > macdData.signal[i] && 
                           macdData.macd[i-1] <= macdData.signal[i-1];
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
}
