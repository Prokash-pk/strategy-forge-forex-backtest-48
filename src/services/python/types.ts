
export interface StrategyResult {
  entry: boolean[];
  exit: boolean[];
  indicators?: Record<string, number[]>;
  error?: string;
}

export interface MarketData {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

declare global {
  interface Window {
    loadPyodide: any;
    pyodide: any;
  }
}
