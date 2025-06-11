
import { PositionSizingConfig } from './types';

export class PositionSizer {
  static calculatePositionSize(
    accountBalance: number,
    riskPerTrade: number,
    maxPositionSize: number = 100000,
    minPositionSize: number = 100
  ): number {
    // Calculate risk amount (percentage of account)
    const riskAmount = accountBalance * (riskPerTrade / 100);
    
    // Simple position sizing based on risk amount
    // In a real implementation, this would consider stop loss distance
    let positionSize = Math.floor(riskAmount * 10); // Simplified calculation
    
    // Apply position limits
    positionSize = Math.max(minPositionSize, positionSize);
    positionSize = Math.min(maxPositionSize, positionSize);
    
    console.log(`Position sizing: Account=${accountBalance}, Risk=${riskPerTrade}%, Size=${positionSize}`);
    
    return positionSize;
  }

  static calculatePositionSizeWithStopLoss(
    accountBalance: number,
    riskPerTrade: number,
    stopLossDistance: number,
    currentPrice: number,
    maxPositionSize: number = 100000
  ): number {
    // Calculate risk amount in account currency
    const riskAmount = accountBalance * (riskPerTrade / 100);
    
    // Calculate position size based on stop loss distance
    const stopLossAmount = currentPrice * (stopLossDistance / 10000); // Convert pips to price
    const positionSize = Math.floor(riskAmount / stopLossAmount);
    
    // Apply maximum position size limit
    return Math.min(positionSize, maxPositionSize);
  }

  static validatePositionSize(positionSize: number, config: PositionSizingConfig): boolean {
    return positionSize >= config.minPositionSize && 
           positionSize <= config.maxPositionSize &&
           positionSize > 0;
  }
}
