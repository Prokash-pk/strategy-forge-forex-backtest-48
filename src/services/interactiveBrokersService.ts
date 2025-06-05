
import { IBConfig, IBTrade, IBPosition, IBOrderStatus, IBAccountSummary, IBConnectionTestResult } from '@/types/interactiveBrokers';
import { IBConnectionService } from './ib/ibConnectionService';
import { IBDataService } from './ib/ibDataService';
import { IBTradingService } from './ib/ibTradingService';

export class InteractiveBrokersService {
  static async connect(config: IBConfig): Promise<boolean> {
    const success = await IBConnectionService.connect(config);
    if (success) {
      // Initialize account data
      await IBDataService.requestAccountData();
      await IBDataService.requestPositions();
    }
    return success;
  }

  static async testConnection(config: IBConfig): Promise<IBConnectionTestResult> {
    return IBConnectionService.testConnection(config);
  }

  static disconnect(): void {
    IBConnectionService.disconnect();
  }

  static async placeTrade(trade: IBTrade): Promise<number | null> {
    return IBTradingService.placeTrade(trade);
  }

  static async closePosition(symbol: string): Promise<boolean> {
    return IBTradingService.closePosition(symbol);
  }

  static processBacktestSignals(
    backtestResults: any,
    symbol: string,
    strategyName: string
  ): IBTrade[] {
    return IBTradingService.processBacktestSignals(backtestResults, symbol, strategyName);
  }

  static getConfig(): IBConfig {
    return IBConnectionService.getConfig();
  }

  static isConnected(): boolean {
    return IBConnectionService.isConnected();
  }

  static getPositions(): IBPosition[] {
    return IBDataService.getPositions();
  }

  static getOrders(): IBOrderStatus[] {
    return IBDataService.getOrders();
  }

  static getAccountSummary(): IBAccountSummary | null {
    return IBDataService.getAccountSummary();
  }
}

// Re-export types for backward compatibility
export type { IBPosition, IBOrderStatus, IBAccountSummary, IBConfig, IBTrade } from '@/types/interactiveBrokers';
