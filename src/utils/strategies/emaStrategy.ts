
import { TechnicalAnalysis } from '../technical/TechnicalAnalysis';
import { StrategySignals, MarketData } from '../types/strategyTypes';

export class EMAStrategy {
  static execute(data: MarketData): StrategySignals {
    const ema12 = TechnicalAnalysis.ema(data.close, 12);
    const ema26 = TechnicalAnalysis.ema(data.close, 26);
    
    const entry: boolean[] = [];
    const exit: boolean[] = [];

    for (let i = 0; i < data.close.length; i++) {
      if (i === 0) {
        entry.push(false);
        exit.push(false);
      } else {
        const entrySignal = ema12[i] > ema26[i] && ema12[i-1] <= ema26[i-1];
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
}
