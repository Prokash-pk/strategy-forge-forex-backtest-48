
import { IBPosition, IBOrderStatus, IBAccountSummary } from '@/types/interactiveBrokers';
import { IBConnectionService } from './ibConnectionService';

export class IBDataService {
  private static positions: Map<string, IBPosition> = new Map();
  private static orders: Map<number, IBOrderStatus> = new Map();
  private static accountSummary: IBAccountSummary | null = null;

  static async requestAccountData(): Promise<void> {
    try {
      const baseUrl = IBConnectionService.getBaseUrl();
      const response = await fetch(`${baseUrl}/iserver/accounts`, {
        mode: 'cors'
      });
      if (response.ok) {
        const accounts = await response.json();
        console.log('📊 Account data received:', accounts);
        
        // Mock account summary for now
        this.accountSummary = {
          totalCashValue: 100000,
          netLiquidation: 100000,
          grossPositionValue: 0,
          availableFunds: 100000,
          buyingPower: 400000,
          currency: 'USD'
        };
      }
    } catch (error) {
      console.error('Failed to get account data:', error);
    }
  }

  static async requestPositions(): Promise<void> {
    try {
      const baseUrl = IBConnectionService.getBaseUrl();
      const response = await fetch(`${baseUrl}/iserver/account/positions/0`, {
        mode: 'cors'
      });
      if (response.ok) {
        const positions = await response.json();
        console.log('📈 Positions received:', positions);
        
        // Process positions if any
        this.positions.clear();
        // Mock empty positions for now
      }
    } catch (error) {
      console.error('Failed to get positions:', error);
    }
  }

  static getPositions(): IBPosition[] {
    return Array.from(this.positions.values());
  }

  static getOrders(): IBOrderStatus[] {
    return Array.from(this.orders.values());
  }

  static getAccountSummary(): IBAccountSummary | null {
    return this.accountSummary;
  }
}
