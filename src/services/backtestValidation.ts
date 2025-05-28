
import { BacktestStrategy } from '@/types/backtest';

export class BacktestValidation {
  static validateStrategy(strategy: BacktestStrategy): void {
    if (!strategy.code || strategy.code.trim().length === 0) {
      throw new Error('Strategy code is required');
    }
    
    if (strategy.riskPerTrade <= 0 || strategy.riskPerTrade > 100) {
      throw new Error('Risk per trade must be between 0 and 100%');
    }

    if (strategy.initialBalance <= 0) {
      throw new Error('Initial balance must be greater than 0');
    }

    if (strategy.stopLoss < 0) {
      throw new Error('Stop loss must be non-negative');
    }

    if (strategy.takeProfit < 0) {
      throw new Error('Take profit must be non-negative');
    }
  }
}
