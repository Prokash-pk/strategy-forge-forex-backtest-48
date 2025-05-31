
export interface OANDAConfig {
  accountId: string;
  apiKey: string;
  environment: 'practice' | 'live';
  enabled: boolean;
}

export interface StrategySettings {
  id: string;
  strategy_name: string;
  strategy_code: string;
  symbol: string;
  timeframe: string;
  initial_balance: number;
  risk_per_trade: number;
  stop_loss: number;
  take_profit: number;
  spread: number;
  commission: number;
  slippage: number;
  max_position_size: number;
  risk_model: string;
  reverse_signals: boolean;
  position_sizing_mode: string;
  risk_reward_ratio: number;
  win_rate?: number;
  total_trades?: number;
  total_return?: number;
  profit_factor?: number;
  max_drawdown?: number;
}

export type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';
