
// Type declarations for Pyodide
declare global {
  interface Window {
    loadPyodide: (config?: {
      indexURL?: string;
      fullStdLib?: boolean;
      stdin?: () => string;
      stdout?: (text: string) => void;
      stderr?: (text: string) => void;
    }) => Promise<any>;
  }
}

export interface PyodideInstance {
  runPython: (code: string) => any;
  loadPackage: (packages: string | string[]) => Promise<void>;
  globals: {
    set: (name: string, value: any) => void;
    get: (name: string) => any;
  };
  registerJsModule: (name: string, module: any) => void;
  unpackArchive: (buffer: ArrayBuffer, format: string) => void;
}

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
  direction?: string[];
  trade_direction?: string[];
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
  [key: string]: any;
}
