
export interface StrategySignals {
  entry: boolean[];
  exit: boolean[];
  indicators?: Record<string, any>; // Changed from Record<string, number[]> to Record<string, any> for flexibility
}

export interface MarketData {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}
