
export interface IBPosition {
  symbol: string;
  position: number;
  marketPrice: number;
  marketValue: number;
  averageCost: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

export interface IBOrderStatus {
  orderId: number;
  status: 'Submitted' | 'Filled' | 'Cancelled' | 'PendingSubmit' | 'PreSubmitted';
  filled: number;
  remaining: number;
  avgFillPrice: number;
  lastFillPrice: number;
}

export interface IBAccountSummary {
  totalCashValue: number;
  netLiquidation: number;
  grossPositionValue: number;
  availableFunds: number;
  buyingPower: number;
  currency: string;
}

export interface IBConfig {
  host: string;
  port: number;
  clientId: number;
  isConnected: boolean;
  paperTrading: boolean;
  defaultOrderSize: number;
  riskPerTrade: number;
  autoTrading: boolean;
}

export interface IBTrade {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MKT' | 'LMT' | 'STP';
  price?: number;
  stopPrice?: number;
  timeInForce: 'DAY' | 'GTC' | 'IOC';
  strategyName: string;
}

export class InteractiveBrokersService {
  private static config: IBConfig = {
    host: 'localhost',
    port: 7497, // TWS paper trading port
    clientId: 1,
    isConnected: false,
    paperTrading: true,
    defaultOrderSize: 10000, // 10k units for forex
    riskPerTrade: 1.0,
    autoTrading: false
  };

  private static ws: WebSocket | null = null;
  private static positions: Map<string, IBPosition> = new Map();
  private static orders: Map<number, IBOrderStatus> = new Map();
  private static accountSummary: IBAccountSummary | null = null;

  static async connect(config: IBConfig): Promise<boolean> {
    try {
      this.config = { ...config };
      
      // Connect to IB Gateway or TWS via REST API bridge
      const wsUrl = `ws://${config.host}:${config.port + 1}`; // REST API typically on port+1
      
      return new Promise((resolve, reject) => {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('✅ Connected to Interactive Brokers');
          this.config.isConnected = true;
          this.requestAccountData();
          this.requestPositions();
          resolve(true);
        };
        
        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleIBMessage(data);
        };
        
        this.ws.onerror = (error) => {
          console.error('❌ IB Connection Error:', error);
          this.config.isConnected = false;
          reject(error);
        };
        
        this.ws.onclose = () => {
          console.log('🔌 IB Connection Closed');
          this.config.isConnected = false;
        };
        
        // Timeout after 15 seconds
        setTimeout(() => {
          if (!this.config.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 15000);
      });
    } catch (error) {
      console.error('IB Connection failed:', error);
      throw error;
    }
  }

  static disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.config.isConnected = false;
    }
  }

  static async placeTrade(trade: IBTrade): Promise<number | null> {
    if (!this.config.isConnected || !this.ws) {
      console.warn('IB not connected');
      return null;
    }

    try {
      const orderId = Date.now(); // Simple order ID generation
      
      const order = {
        id: orderId,
        symbol: this.convertSymbolToIB(trade.symbol),
        action: trade.action,
        quantity: trade.quantity,
        orderType: trade.orderType,
        price: trade.price,
        stopPrice: trade.stopPrice,
        timeInForce: trade.timeInForce,
        account: this.config.paperTrading ? 'DU123456' : '', // Paper trading account
        strategyName: trade.strategyName
      };

      this.ws.send(JSON.stringify({
        type: 'PLACE_ORDER',
        order: order
      }));

      console.log('📤 Order sent to IB:', order);
      return orderId;
    } catch (error) {
      console.error('Failed to place IB trade:', error);
      return null;
    }
  }

  static async closePosition(symbol: string): Promise<boolean> {
    const position = this.positions.get(symbol);
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
    
    if (!backtestResults?.entry || !backtestResults?.trade_direction) {
      return trades;
    }

    const { entry, trade_direction, exit } = backtestResults;
    
    for (let i = 0; i < entry.length; i++) {
      // Entry signals
      if (entry[i] && trade_direction[i] && trade_direction[i] !== 'NONE') {
        trades.push({
          symbol,
          action: trade_direction[i] as 'BUY' | 'SELL',
          quantity: this.config.defaultOrderSize,
          orderType: 'MKT',
          timeInForce: 'DAY',
          strategyName
        });
      }
      
      // Exit signals
      if (exit?.[i]) {
        trades.push({
          symbol,
          action: trade_direction[i] === 'BUY' ? 'SELL' : 'BUY',
          quantity: this.config.defaultOrderSize,
          orderType: 'MKT',
          timeInForce: 'DAY',
          strategyName: `${strategyName}_EXIT`
        });
      }
    }
    
    return trades;
  }

  private static handleIBMessage(data: any): void {
    switch (data.type) {
      case 'POSITION_UPDATE':
        this.updatePosition(data.position);
        break;
      case 'ORDER_STATUS':
        this.updateOrderStatus(data.order);
        break;
      case 'ACCOUNT_SUMMARY':
        this.accountSummary = data.summary;
        break;
      case 'ERROR':
        console.error('IB Error:', data.message);
        break;
      default:
        console.log('IB Message:', data);
    }
  }

  private static updatePosition(position: IBPosition): void {
    this.positions.set(position.symbol, position);
  }

  private static updateOrderStatus(order: IBOrderStatus): void {
    this.orders.set(order.orderId, order);
  }

  private static requestAccountData(): void {
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: 'REQUEST_ACCOUNT_SUMMARY' }));
    }
  }

  private static requestPositions(): void {
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: 'REQUEST_POSITIONS' }));
    }
  }

  private static convertSymbolToIB(symbol: string): string {
    // Convert various symbol formats to IB format
    let ibSymbol = symbol;
    
    if (symbol.includes('=X')) {
      // Yahoo Finance format like USDJPY=X
      ibSymbol = symbol.replace('=X', '');
    }
    
    if (symbol.includes('/')) {
      // Format like EUR/USD
      ibSymbol = symbol.replace('/', '.');
    } else if (symbol.length === 6 && !symbol.includes('.')) {
      // Format like EURUSD - convert to EUR.USD
      ibSymbol = `${symbol.slice(0, 3)}.${symbol.slice(3)}`;
    }

    return ibSymbol;
  }

  static getConfig(): IBConfig {
    return { ...this.config };
  }

  static isConnected(): boolean {
    return this.config.isConnected;
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
