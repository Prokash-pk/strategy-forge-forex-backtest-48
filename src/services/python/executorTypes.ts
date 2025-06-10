
export interface ExecutorConfig {
  timeoutMs?: number;
  retryAttempts?: number;
  enableDebugLogging?: boolean;
}

export interface ExecutionContext {
  marketData: any;
  strategyCode: string;
  config?: ExecutorConfig;
}

export interface ExecutionState {
  isInitializing: boolean;
  isExecuting: boolean;
  lastError: Error | null;
  executionCount: number;
}
