
export interface TradeSignal {
  action: 'BUY' | 'SELL' | 'CLOSE';
  symbol: string;
  direction: 'BUY' | 'SELL' | null;
  confidence: number;
  timestamp: string;
}

export interface TradeOrder {
  action: 'BUY' | 'SELL' | 'CLOSE';
  symbol: string;
  units: number;
  stopLoss?: string;
  takeProfit?: string;
  strategyId: string;
  userId: string;
}

export interface PositionSizingConfig {
  accountBalance: number;
  riskPerTrade: number;
  maxPositionSize: number;
  minPositionSize: number;
}

export interface RiskManagementConfig {
  stopLossDistance: number;
  takeProfitDistance: number;
  maxDailyLoss: number;
  maxDrawdown: number;
}

export interface BacktestSignals {
  entry: boolean[];
  exit: boolean[];
  direction: (string | null)[];
  close?: number[];
}
