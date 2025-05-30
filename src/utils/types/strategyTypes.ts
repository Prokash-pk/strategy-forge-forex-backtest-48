
export interface StrategySignals {
  entry: boolean[];
  exit: boolean[];
  indicators?: Record<string, number[]>;
}

export interface MarketData {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}
