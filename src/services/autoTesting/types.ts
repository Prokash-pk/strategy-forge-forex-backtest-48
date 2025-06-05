
export interface AutoTestResult {
  timestamp: string;
  symbol: string;
  currentPrice: number;
  candleData: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
  strategySignals: {
    hasEntry: boolean;
    hasExit: boolean;
    direction: 'BUY' | 'SELL' | null;
    confidence: number;
  };
  technicalIndicators: {
    rsi?: number;
    ema_fast?: number;
    ema_slow?: number;
    macd?: number;
  };
}
