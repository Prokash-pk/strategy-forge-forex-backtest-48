
export interface MarketData {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

export interface StrategyResult {
  entry: boolean[];
  exit: boolean[];
  direction?: string[];  // Add direction as optional
  trade_direction?: string[];  // Alternative name for direction
  error?: string;
  // Optional technical indicators that strategies might return
  rsi?: number[];
  ema_fast?: number[];
  ema_slow?: number[];
  short_ema?: number[];
  long_ema?: number[];
  daily_ema?: number[];
  atr?: number[];
  avg_atr?: number[];
  [key: string]: any;  // Allow for additional indicators
}
