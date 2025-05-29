
import { supabase } from '@/integrations/supabase/client';
import { StrategyResult } from '../strategyStorage';

export class StrategyFilteringService {
  static async getHighReturnStrategies(minReturn: number = 15, minWinRate: number = 60): Promise<StrategyResult[]> {
    try {
      const { data: results, error } = await supabase
        .from('strategy_results')
        .select('*')
        .or(`total_return.gte.${minReturn},win_rate.gte.${minWinRate}`)
        .order('total_return', { ascending: false });

      if (error) throw error;
      return results || [];
    } catch (error) {
      console.error('Failed to get high return strategies:', error);
      throw error;
    }
  }

  static async getStrategyByPerformance(sortBy: 'return' | 'winrate' | 'trades' = 'return'): Promise<StrategyResult[]> {
    try {
      let orderColumn = 'total_return';
      if (sortBy === 'winrate') orderColumn = 'win_rate';
      if (sortBy === 'trades') orderColumn = 'total_trades';

      const { data: results, error } = await supabase
        .from('strategy_results')
        .select('*')
        .order(orderColumn, { ascending: false })
        .limit(50);

      if (error) throw error;
      return results || [];
    } catch (error) {
      console.error('Failed to get strategies by performance:', error);
      throw error;
    }
  }
}
