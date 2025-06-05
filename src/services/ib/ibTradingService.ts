
import { IBTrade, IBPosition } from '@/types/interactiveBrokers';
import { IBConnectionService } from './ibConnectionService';
import { IBUtilityService } from './ibUtilityService';
import { IBDataService } from './ibDataService';

export class IBTradingService {
  static async placeTrade(trade: IBTrade): Promise<number | null> {
    if (!IBConnectionService.isConnected()) {
      console.warn('IB not connected');
      return null;
    }

    try {
      const orderId = Date.now();
      const config = IBConnectionService.getConfig();
      
      const order = {
        acctId: config.paperTrading ? 'DU123456' : '',
        conid: await IBUtilityService.getContractId(trade.symbol),
        orderType: trade.orderType,
        side: trade.action,
        quantity: trade.quantity,
        price: trade.price,
        tif: trade.timeInForce,
      };

      const baseUrl = IBConnectionService.getBaseUrl();
      const response = await fetch(`${baseUrl}/iserver/account/${order.acctId}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orders: [order]
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📤 Order sent to IB:', result);
        return orderId;
      } else {
        throw new Error(`Order failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to place IB trade:', error);
      return null;
    }
  }

  static async closePosition(symbol: string): Promise<boolean> {
    const positions = IBDataService.getPositions();
    const position = positions.find(p => p.symbol === symbol);
    
    if (!position) {
      console.warn(`No position found for ${symbol}`);
      return false;
    }

    const trade: IBTrade = {
      symbol,
      action: position.position > 0 ? 'SELL' : 'BUY',
      quantity: Math.abs(position.position),
      orderType: 'MKT',
      timeInForce: 'DAY',
      strategyName: 'CLOSE_POSITION'
    };

    const orderId = await this.placeTrade(trade);
    return orderId !== null;
  }

  static processBacktestSignals(
    backtestResults: any,
    symbol: string,
    strategyName: string
  ): IBTrade[] {
    const trades: IBTrade[] = [];
    const config = IBConnectionService.getConfig();
    
    if (!backtestResults?.entry || !backtestResults?.trade_direction) {
      return trades;
    }

    const { entry, trade_direction, exit } = backtestResults;
    
    for (let i = 0; i < entry.length; i++) {
      if (entry[i] && trade_direction[i] && trade_direction[i] !== 'NONE') {
        trades.push({
          symbol,
          action: trade_direction[i] as 'BUY' | 'SELL',
          quantity: config.defaultOrderSize,
          orderType: 'MKT',
          timeInForce: 'DAY',
          strategyName
        });
      }
      
      if (exit?.[i]) {
        trades.push({
          symbol,
          action: trade_direction[i] === 'BUY' ? 'SELL' : 'BUY',
          quantity: config.defaultOrderSize,
          orderType: 'MKT',
          timeInForce: 'DAY',
          strategyName: `${strategyName}_EXIT`
        });
      }
    }
    
    return trades;
  }
}
