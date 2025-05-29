
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBacktestUsage = () => {
  const [backtestCount, setBacktestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { subscriptionTier } = useSubscription();
  const { toast } = useToast();

  // Get limits based on subscription tier
  const getBacktestLimit = () => {
    switch (subscriptionTier) {
      case 'Free':
        return 1;
      case 'Starter':
        return 10;
      case 'Pro':
      case 'Lifetime':
        return Infinity;
      default:
        return 1;
    }
  };

  const limit = getBacktestLimit();
  const canRunBacktest = backtestCount < limit;

  const loadBacktestCount = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get current month start and end
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from('strategy_results')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (error) throw error;

      setBacktestCount(data?.length || 0);
    } catch (error) {
      console.error('Failed to load backtest count:', error);
      toast({
        title: "Failed to load usage",
        description: "Could not fetch backtest usage",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const incrementBacktestCount = () => {
    setBacktestCount(prev => prev + 1);
  };

  const checkCanRunBacktest = () => {
    if (!canRunBacktest) {
      toast({
        title: "Backtest Limit Reached",
        description: `You've reached your monthly limit of ${limit} backtest${limit === 1 ? '' : 's'}. Upgrade your plan to run more backtests.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  useEffect(() => {
    loadBacktestCount();
  }, [user, subscriptionTier]);

  return {
    backtestCount,
    limit,
    canRunBacktest,
    loading,
    checkCanRunBacktest,
    incrementBacktestCount,
    refreshUsage: loadBacktestCount
  };
};
