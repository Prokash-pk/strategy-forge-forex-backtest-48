
export interface AutoTestResult {
  timestamp: string;
  symbol: string;
  currentPrice: number;
  candleData: any[];
  strategySignals: {
    hasSignals: boolean;
    entryCount: number;
    exitCount: number;
    directions: string[];
    confidence: number;
    technicalIndicators: any;
    rawResult: any;
    error?: string;
  };
}

export interface TestConfig {
  symbol: string;
  timeframe: string;
  interval: number;
  candleCount: number;
}

export interface TestSession {
  id: string;
  config: TestConfig;
  startTime: string;
  lastTest: string;
  isActive: boolean;
  testCount: number;
}
