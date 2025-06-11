
export interface SignalValidationResult {
  isValid: boolean;
  message: string;
}

export interface SignalStats {
  total_entries: number;
  buy_signals: number;
  sell_signals: number;
}

export interface ProcessedSignalResult {
  entry: boolean[];
  exit: boolean[];
  direction: (string | null)[];
  reverse_signals_applied: boolean;
  validation_passed: boolean;
  validation_message: string;
  auto_generated_direction: boolean;
  signal_stats: SignalStats;
  error?: string;
  [key: string]: any;
}
