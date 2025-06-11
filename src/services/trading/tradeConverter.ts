
import { TradeSignal, TradeOrder, BacktestSignals } from './types';
import { PositionSizer } from './positionSizer';
import { RiskManager } from './riskManager';

export class TradeConverter {
  static convertSignalToOrder(
    signal: TradeSignal,
    strategyId: string,
    userId: string,
    accountBalance: number,
    riskConfig: any
  ): TradeOrder {
    const positionSize = PositionSizer.calculatePositionSize(
      accountBalance,
      riskConfig.riskPerTrade || 2,
      riskConfig.maxPositionSize || 100000
    );

    const order: TradeOrder = {
      action: signal.action,
      symbol: signal.symbol,
      units: positionSize,
      strategyId,
      userId
    };

    // Add risk management levels
    if (signal.action !== 'CLOSE') {
      const riskLevels = RiskManager.calculateRiskLevels(
        riskConfig.stopLoss || 40,
        riskConfig.takeProfit || 80
      );
      
      order.stopLoss = riskLevels.stopLoss;
      order.takeProfit = riskLevels.takeProfit;
    }

    return order;
  }

  static convertBacktestSignalsToOrders(
    signals: BacktestSignals,
    symbol: string,
    strategyId: string,
    userId: string,
    accountBalance: number,
    riskConfig: any
  ): TradeOrder[] {
    const orders: TradeOrder[] = [];
    const { entry, exit, direction } = signals;

    for (let i = 0; i < entry.length; i++) {
      // Entry signals
      if (entry[i] && direction[i] && (direction[i] === 'BUY' || direction[i] === 'SELL')) {
        const signal: TradeSignal = {
          action: direction[i] as 'BUY' | 'SELL',
          symbol,
          direction: direction[i] as 'BUY' | 'SELL',
          confidence: 0.8,
          timestamp: new Date().toISOString()
        };

        const order = this.convertSignalToOrder(
          signal,
          strategyId,
          userId,
          accountBalance,
          riskConfig
        );

        orders.push(order);
      }

      // Exit signals
      if (exit && exit[i]) {
        const closeOrder: TradeOrder = {
          action: 'CLOSE',
          symbol,
          units: 0, // Will be determined by the broker
          strategyId: `${strategyId}_EXIT`,
          userId
        };

        orders.push(closeOrder);
      }
    }

    return orders;
  }
}
