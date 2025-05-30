
import { TechnicalAnalysis } from '../technical/TechnicalAnalysis';
import { StrategySignals, MarketData } from '../types/strategyTypes';

export class RSIStrategy {
  static execute(data: MarketData): StrategySignals {
    const rsi = TechnicalAnalysis.rsi(data.close, 14);
    const entry: boolean[] = [];
    const exit: boolean[] = [];

    for (let i = 0; i < data.close.length; i++) {
      const entrySignal = i > 0 && rsi[i] > 30 && rsi[i-1] <= 30;
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
}
