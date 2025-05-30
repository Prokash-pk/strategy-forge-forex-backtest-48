
import { AdvancedTechnicalAnalysis } from '../advancedTechnicalAnalysis';
import { TechnicalAnalysis } from '../technical/TechnicalAnalysis';
import { StrategySignals, MarketData } from '../types/strategyTypes';

export class AdvancedStrategies {
  static executeWilliamsR(data: MarketData): StrategySignals {
    const williamsR = AdvancedTechnicalAnalysis.williamsR(data.high, data.low, data.close, 14);
    const entry: boolean[] = [];
    const exit: boolean[] = [];

    for (let i = 0; i < data.close.length; i++) {
      const entrySignal = i > 0 && williamsR[i] > -80 && williamsR[i-1] <= -80;
      const exitSignal = i > 0 && williamsR[i] < -20 && williamsR[i-1] >= -20;
      
      entry.push(entrySignal);
      exit.push(exitSignal);
    }

    return {
      entry,
      exit,
      indicators: { williamsR }
    };
  }

  static executeStochastic(data: MarketData): StrategySignals {
    const stoch = AdvancedTechnicalAnalysis.stochasticOscillator(data.high, data.low, data.close);
    const entry: boolean[] = [];
    const exit: boolean[] = [];

    for (let i = 0; i < data.close.length; i++) {
      const entrySignal = i > 0 && 
        stoch.k[i] > stoch.d[i] && 
        stoch.k[i-1] <= stoch.d[i-1] && 
        stoch.k[i] < 20;
      
      const exitSignal = i > 0 && 
        stoch.k[i] < stoch.d[i] && 
        stoch.k[i-1] >= stoch.d[i-1] && 
        stoch.k[i] > 80;
      
      entry.push(entrySignal);
      exit.push(exitSignal);
    }

    return {
      entry,
      exit,
      indicators: { 
        stoch_k: stoch.k, 
        stoch_d: stoch.d 
      }
    };
  }

  static executeATR(data: MarketData): StrategySignals {
    const atr = AdvancedTechnicalAnalysis.atr(data.high, data.low, data.close, 14);
    const sma = TechnicalAnalysis.sma(data.close, 20);
    const entry: boolean[] = [];
    const exit: boolean[] = [];

    for (let i = 0; i < data.close.length; i++) {
      const entrySignal = i > 0 && 
        !isNaN(atr[i]) && !isNaN(sma[i]) &&
        data.close[i] > sma[i] + atr[i] && 
        data.close[i-1] <= sma[i-1] + atr[i-1];
      
      const exitSignal = i > 0 && 
        !isNaN(sma[i]) &&
        data.close[i] < sma[i] && 
        data.close[i-1] >= sma[i-1];
      
      entry.push(entrySignal);
      exit.push(exitSignal);
    }

    return {
      entry,
      exit,
      indicators: { atr, sma }
    };
  }

  static executeCCI(data: MarketData): StrategySignals {
    const cci = AdvancedTechnicalAnalysis.commodityChannelIndex(data.high, data.low, data.close, 20);
    const entry: boolean[] = [];
    const exit: boolean[] = [];

    for (let i = 0; i < data.close.length; i++) {
      const entrySignal = i > 0 && cci[i] > -100 && cci[i-1] <= -100;
      const exitSignal = i > 0 && cci[i] < 100 && cci[i-1] >= 100;
      
      entry.push(entrySignal);
      exit.push(exitSignal);
    }

    return {
      entry,
      exit,
      indicators: { cci }
    };
  }
}
