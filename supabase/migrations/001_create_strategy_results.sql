
-- Create table to store strategy results
CREATE TABLE strategy_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_name TEXT NOT NULL,
  strategy_code TEXT NOT NULL,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  win_rate DECIMAL(5,2),
  total_return DECIMAL(10,2),
  total_trades INTEGER,
  profit_factor DECIMAL(10,2),
  max_drawdown DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE strategy_results ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can make this more restrictive later)
CREATE POLICY "Allow all operations on strategy_results" ON strategy_results
  FOR ALL USING (true);
