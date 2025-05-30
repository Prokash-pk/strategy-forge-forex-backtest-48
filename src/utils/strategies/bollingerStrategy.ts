
import { TechnicalAnalysis } from '../technical/TechnicalAnalysis';
import { StrategySignals, MarketData } from '../types/strategyTypes';

export class BollingerStrategy {
  static execute(data: MarketData): StrategySignals {
    const bb = TechnicalAnalysis.bollingerBands(data.close);
    const entry: boolean[] = [];
    const exit: boolean[] = [];

    for (let i = 0; i < data.close.length; i++) {
      const entrySignal = data.close[i] <= bb.lower[i];
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
}
