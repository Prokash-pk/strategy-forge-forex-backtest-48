
-- Add additional columns to store complete strategy configuration
ALTER TABLE strategy_results ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(15,2);
ALTER TABLE strategy_results ADD COLUMN IF NOT EXISTS risk_per_trade DECIMAL(5,2);
ALTER TABLE strategy_results ADD COLUMN IF NOT EXISTS stop_loss DECIMAL(8,2);
ALTER TABLE strategy_results ADD COLUMN IF NOT EXISTS take_profit DECIMAL(8,2);
ALTER TABLE strategy_results ADD COLUMN IF NOT EXISTS spread DECIMAL(5,2);
ALTER TABLE strategy_results ADD COLUMN IF NOT EXISTS commission DECIMAL(5,2);
ALTER TABLE strategy_results ADD COLUMN IF NOT EXISTS slippage DECIMAL(5,2);
ALTER TABLE strategy_results ADD COLUMN IF NOT EXISTS max_position_size BIGINT;
ALTER TABLE strategy_results ADD COLUMN IF NOT EXISTS risk_model TEXT;
ALTER TABLE strategy_results ADD COLUMN IF NOT EXISTS position_sizing_mode TEXT;
ALTER TABLE strategy_results ADD COLUMN IF NOT EXISTS risk_reward_ratio DECIMAL(5,2);
ALTER TABLE strategy_results ADD COLUMN IF NOT EXISTS reverse_signals BOOLEAN DEFAULT FALSE;

-- Add user_id column if it doesn't exist (for RLS)
ALTER TABLE strategy_results ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update RLS policy to use user_id
DROP POLICY IF EXISTS "Allow all operations on strategy_results" ON strategy_results;

CREATE POLICY "Users can manage their own strategy results" ON strategy_results
  FOR ALL USING (auth.uid() = user_id);
