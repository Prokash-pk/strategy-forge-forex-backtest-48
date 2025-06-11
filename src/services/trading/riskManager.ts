
import { RiskManagementConfig } from './types';

export class RiskManager {
  static calculateRiskLevels(
    stopLossPips: number,
    takeProfitPips: number,
    currentPrice?: number
  ): { stopLoss: string; takeProfit: string } {
    // Convert pips to price distance (simplified for major pairs)
    const pipValue = 0.0001; // 1 pip for major pairs
    
    if (currentPrice) {
      const stopLossPrice = currentPrice - (stopLossPips * pipValue);
      const takeProfitPrice = currentPrice + (takeProfitPips * pipValue);
      
      return {
        stopLoss: stopLossPrice.toFixed(5),
        takeProfit: takeProfitPrice.toFixed(5)
      };
    }

    // Return pip distances if no current price available
    return {
      stopLoss: (stopLossPips * pipValue).toFixed(5),
      takeProfit: (takeProfitPips * pipValue).toFixed(5)
    };
  }

  static validateRiskLevels(
    stopLoss: number,
    takeProfit: number,
    currentPrice: number,
    action: 'BUY' | 'SELL'
  ): boolean {
    if (action === 'BUY') {
      return stopLoss < currentPrice && takeProfit > currentPrice;
    } else {
      return stopLoss > currentPrice && takeProfit < currentPrice;
    }
  }

  static calculateRiskRewardRatio(
    entryPrice: number,
    stopLoss: number,
    takeProfit: number,
    action: 'BUY' | 'SELL'
  ): number {
    let risk: number;
    let reward: number;

    if (action === 'BUY') {
      risk = entryPrice - stopLoss;
      reward = takeProfit - entryPrice;
    } else {
      risk = stopLoss - entryPrice;
      reward = entryPrice - takeProfit;
    }

    return risk > 0 ? reward / risk : 0;
  }

  static assessTradeRisk(
    accountBalance: number,
    positionSize: number,
    stopLossDistance: number,
    config: RiskManagementConfig
  ): { isAcceptable: boolean; riskPercentage: number; warnings: string[] } {
    const warnings: string[] = [];
    const potentialLoss = positionSize * (stopLossDistance / 10000);
    const riskPercentage = (potentialLoss / accountBalance) * 100;

    let isAcceptable = true;

    if (riskPercentage > config.maxDailyLoss) {
      warnings.push(`Risk exceeds daily loss limit: ${riskPercentage.toFixed(2)}%`);
      isAcceptable = false;
    }

    if (potentialLoss > accountBalance * (config.maxDrawdown / 100)) {
      warnings.push(`Potential loss exceeds drawdown limit`);
      isAcceptable = false;
    }

    return {
      isAcceptable,
      riskPercentage,
      warnings
    };
  }
}
