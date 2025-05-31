
-- Create table for storing OANDA API configurations
CREATE TABLE oanda_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  config_name text NOT NULL,
  account_id text NOT NULL,
  api_key text NOT NULL, -- In production, this should be encrypted
  environment text NOT NULL CHECK (environment IN ('practice', 'live')),
  enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_oanda_configs_user_id ON oanda_configs(user_id);

-- Enable RLS
ALTER TABLE oanda_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own OANDA configs" ON oanda_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OANDA configs" ON oanda_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OANDA configs" ON oanda_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own OANDA configs" ON oanda_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_oanda_configs_updated_at 
  BEFORE UPDATE ON oanda_configs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
