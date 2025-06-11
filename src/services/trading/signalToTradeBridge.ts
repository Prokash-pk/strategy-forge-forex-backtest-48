
import { SignalValidator } from './signalValidator';
import { TradeConverter } from './tradeConverter';
import { PositionSizer } from './positionSizer';
import { RiskManager } from './riskManager';
import type { TradeSignal, TradeOrder, BacktestSignals } from './types';

export class SignalToTradeBridge {
  static processTradeSignal(
    signal: TradeSignal,
    strategyId: string,
    userId: string,
    accountBalance: number,
    riskConfig: any
  ): TradeOrder | null {
    // Validate the incoming signal
    if (!SignalValidator.validateTradeSignal(signal)) {
      console.error('Invalid trade signal received');
      return null;
    }

    // Convert signal to trade order
    try {
      const order = TradeConverter.convertSignalToOrder(
        signal,
        strategyId,
        userId,
        accountBalance,
        riskConfig
      );

      console.log('Trade signal processed successfully:', order);
      return order;
    } catch (error) {
      console.error('Failed to process trade signal:', error);
      return null;
    }
  }

  static processBacktestSignals(
    signals: BacktestSignals,
    symbol: string,
    strategyId: string,
    userId: string,
    accountBalance: number = 10000,
    riskConfig: any = {}
  ): TradeOrder[] {
    // Validate backtest signals
    if (!SignalValidator.validateBacktestSignals(signals)) {
      console.error('Invalid backtest signals');
      return [];
    }

    // Check if there are any valid trading signals
    if (!SignalValidator.hasValidTradingSignals(signals)) {
      console.warn('No valid trading signals found in backtest results');
      return [];
    }

    // Convert signals to trade orders
    try {
      const orders = TradeConverter.convertBacktestSignalsToOrders(
        signals,
        symbol,
        strategyId,
        userId,
        accountBalance,
        riskConfig
      );

      console.log(`Processed ${orders.length} trade orders from backtest signals`);
      return orders;
    } catch (error) {
      console.error('Failed to process backtest signals:', error);
      return [];
    }
  }

  static validateOrderRisk(
    order: TradeOrder,
    accountBalance: number,
    riskConfig: any
  ): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Validate position size
    const positionConfig = {
      accountBalance,
      riskPerTrade: riskConfig.riskPerTrade || 2,
      maxPositionSize: riskConfig.maxPositionSize || 100000,
      minPositionSize: 100
    };

    if (!PositionSizer.validatePositionSize(order.units, positionConfig)) {
      warnings.push('Position size outside acceptable limits');
    }

    // Assess trade risk if we have stop loss information
    if (order.stopLoss && riskConfig.stopLoss) {
      const riskAssessment = RiskManager.assessTradeRisk(
        accountBalance,
        order.units,
        riskConfig.stopLoss,
        {
          stopLossDistance: riskConfig.stopLoss || 40,
          takeProfitDistance: riskConfig.takeProfit || 80,
          maxDailyLoss: riskConfig.maxDailyLoss || 5,
          maxDrawdown: riskConfig.maxDrawdown || 10
        }
      );

      warnings.push(...riskAssessment.warnings);
      
      if (!riskAssessment.isAcceptable) {
        return { isValid: false, warnings };
      }
    }

    return { isValid: warnings.length === 0, warnings };
  }
}

// Export for backward compatibility
export { SignalValidator, TradeConverter, PositionSizer, RiskManager };
export type { TradeSignal, TradeOrder, BacktestSignals };
