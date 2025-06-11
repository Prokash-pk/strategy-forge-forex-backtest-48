
import { SignalValidator } from './signalValidator';
import { TradeConverter } from './tradeConverter';
import { PositionSizer } from './positionSizer';
import { RiskManager } from './riskManager';
import type { TradeSignal, TradeOrder, BacktestSignals } from './types';

export class SignalToTradeBridge {
  private static instances: Map<string, SignalToTradeBridge> = new Map();
  private strategyId: string;
  private userId: string;
  private config: any;

  constructor(strategyId: string, userId: string, config: any) {
    this.strategyId = strategyId;
    this.userId = userId;
    this.config = config;
  }

  static async createFromSavedConfig(strategyId: string, userId: string): Promise<SignalToTradeBridge | null> {
    try {
      // This would typically load saved OANDA configuration
      // For now, return a basic instance
      const config = {
        accountBalance: 10000,
        riskPerTrade: 2,
        maxPositionSize: 100000,
        stopLoss: 40,
        takeProfit: 80
      };

      const bridge = new SignalToTradeBridge(strategyId, userId, config);
      this.instances.set(`${strategyId}-${userId}`, bridge);
      return bridge;
    } catch (error) {
      console.error('Failed to create trade bridge from saved config:', error);
      return null;
    }
  }

  async processSignal(signal: any): Promise<{ success: boolean; message: string; tradeId?: string }> {
    try {
      // Convert the signal format
      const tradeSignal: TradeSignal = {
        action: signal.signal as 'BUY' | 'SELL' | 'CLOSE',
        symbol: signal.symbol,
        direction: signal.signal === 'CLOSE' ? null : signal.signal as 'BUY' | 'SELL',
        confidence: signal.confidence / 100, // Convert from percentage
        timestamp: new Date().toISOString()
      };

      // Process the trade signal
      const order = this.processTradeSignal(
        tradeSignal,
        this.strategyId,
        this.userId,
        this.config.accountBalance || 10000,
        this.config
      );

      if (!order) {
        return {
          success: false,
          message: 'Failed to create trade order from signal'
        };
      }

      // In a real implementation, this would execute the trade via OANDA API
      console.log('Trade order created:', order);

      return {
        success: true,
        message: `${order.action} order created for ${order.symbol} with ${order.units} units`,
        tradeId: `trade_${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error processing signal: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

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

  processTradeSignal(
    signal: TradeSignal,
    strategyId: string,
    userId: string,
    accountBalance: number,
    riskConfig: any
  ): TradeOrder | null {
    return SignalToTradeBridge.processTradeSignal(signal, strategyId, userId, accountBalance, riskConfig);
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
