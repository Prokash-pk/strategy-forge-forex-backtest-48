
import { TradeSignal, BacktestSignals } from './types';

export class SignalValidator {
  static validateTradeSignal(signal: TradeSignal): boolean {
    if (!signal.action || !signal.symbol) {
      console.error('Invalid signal: Missing action or symbol');
      return false;
    }

    if (signal.action !== 'CLOSE' && !signal.direction) {
      console.error('Invalid signal: Missing direction for non-close action');
      return false;
    }

    if (signal.confidence < 0 || signal.confidence > 1) {
      console.error('Invalid signal: Confidence must be between 0 and 1');
      return false;
    }

    return true;
  }

  static validateBacktestSignals(signals: BacktestSignals): boolean {
    const { entry, exit, direction } = signals;

    if (!Array.isArray(entry) || !Array.isArray(exit) || !Array.isArray(direction)) {
      console.error('Invalid backtest signals: Arrays required');
      return false;
    }

    if (entry.length !== exit.length || entry.length !== direction.length) {
      console.error('Invalid backtest signals: Array lengths must match');
      return false;
    }

    return true;
  }

  static hasValidTradingSignals(signals: BacktestSignals): boolean {
    const { entry, direction } = signals;
    
    for (let i = 0; i < entry.length; i++) {
      if (entry[i] && direction[i] && (direction[i] === 'BUY' || direction[i] === 'SELL')) {
        return true;
      }
    }

    return false;
  }
}
