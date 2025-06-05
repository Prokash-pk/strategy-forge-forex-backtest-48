
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

export interface IBConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
}
