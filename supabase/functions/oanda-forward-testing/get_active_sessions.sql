
-- Create a helper function to get active trading sessions
CREATE OR REPLACE FUNCTION public.get_active_trading_sessions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  strategy_id TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_execution TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    ts.id,
    ts.user_id,
    ts.strategy_id,
    ts.is_active,
    ts.created_at,
    ts.updated_at,
    ts.last_execution
  FROM public.trading_sessions ts
  WHERE ts.user_id = p_user_id 
  AND ts.is_active = true;
$$;
