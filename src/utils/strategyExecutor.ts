
import { AdvancedTechnicalAnalysis } from './advancedTechnicalAnalysis';
import { TechnicalAnalysis } from './technical/TechnicalAnalysis';
import { EMAStrategy } from './strategies/emaStrategy';
import { RSIStrategy } from './strategies/rsiStrategy';
import { MACDStrategy } from './strategies/macdStrategy';
import { BollingerStrategy } from './strategies/bollingerStrategy';
import { AdvancedStrategies } from './strategies/advancedStrategies';
import { CustomStrategy } from './strategies/customStrategy';
import { SmartMomentumStrategy } from './strategies/smartMomentumStrategy';
import { EnhancedMomentumStrategy } from './strategies/enhancedMomentumStrategy';
import { StrategySignals, MarketData } from './types/strategyTypes';

// Re-export TechnicalAnalysis for backward compatibility
export { TechnicalAnalysis };

export class StrategyExecutor {
  static executeStrategy(code: string, marketData: MarketData, reverseSignals: boolean = false): StrategySignals {
    try {
      console.log('Executing strategy code with reverse signals:', reverseSignals);
      
      const data = {
        open: marketData.open,
        high: marketData.high,
        low: marketData.low,
        close: marketData.close,
        volume: marketData.volume
      };

      // Route to appropriate strategy based on code content
      if (code.toLowerCase().includes('smart momentum') || code.toLowerCase().includes('enhanced momentum')) {
        return SmartMomentumStrategy.execute(data, reverseSignals);
      } else if (code.toLowerCase().includes('momentum') && code.toLowerCase().includes('quality')) {
        return EnhancedMomentumStrategy.execute(data);
      } else if (code.toLowerCase().includes('williams') || code.toLowerCase().includes('%r')) {
        return AdvancedStrategies.executeWilliamsR(data);
      } else if (code.toLowerCase().includes('stochastic')) {
        return AdvancedStrategies.executeStochastic(data);
      } else if (code.toLowerCase().includes('atr')) {
        return AdvancedStrategies.executeATR(data);
      } else if (code.toLowerCase().includes('cci')) {
        return AdvancedStrategies.executeCCI(data);
      } else if (code.toLowerCase().includes('ema') && code.toLowerCase().includes('crossover')) {
        return EMAStrategy.execute(data);
      } else if (code.toLowerCase().includes('rsi')) {
        return RSIStrategy.execute(data);
      } else if (code.toLowerCase().includes('macd')) {
        return MACDStrategy.execute(data);
      } else if (code.toLowerCase().includes('bollinger')) {
        return BollingerStrategy.execute(data);
      } else {
        return CustomStrategy.execute(code, data);
      }
    } catch (error) {
      console.error('Strategy execution error:', error);
      return EMAStrategy.execute({
        open: marketData.open,
        high: marketData.high,
        low: marketData.low,
        close: marketData.close,
        volume: marketData.volume
      });
    }
  }
}
