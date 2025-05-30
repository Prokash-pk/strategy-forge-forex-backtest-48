
import { TechnicalAnalysis } from '../technical/TechnicalAnalysis';
import { StrategySignals, MarketData } from '../types/strategyTypes';
import { EMAStrategy } from './emaStrategy';

export class CustomStrategy {
  static execute(code: string, data: MarketData): StrategySignals {
    const entry = new Array(data.close.length).fill(false);
    const exit = new Array(data.close.length).fill(false);
    
    const smaMatch = code.match(/sma.*?(\d+)/i);
    const emaMatch = code.match(/ema.*?(\d+)/i);
    
    if (smaMatch || emaMatch) {
      const period = parseInt(smaMatch?.[1] || emaMatch?.[1] || '20');
      const ma = smaMatch ? 
        TechnicalAnalysis.sma(data.close, period) : 
        TechnicalAnalysis.ema(data.close, period);
      
      for (let i = 1; i < data.close.length; i++) {
        entry[i] = data.close[i] > ma[i] && data.close[i-1] <= ma[i-1];
        exit[i] = data.close[i] < ma[i] && data.close[i-1] >= ma[i-1];
      }
      
      return {
        entry,
        exit,
        indicators: { ma }
      };
    }
    
    return EMAStrategy.execute(data);
  }
}
