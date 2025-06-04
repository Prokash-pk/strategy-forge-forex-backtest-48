
export interface StrategySignals {
  entry: boolean[];
  exit: boolean[];
  tradeDirection?: string[]; // Add trade direction as optional
  indicators?: Record<string, any>;
}

export interface MarketData {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}
