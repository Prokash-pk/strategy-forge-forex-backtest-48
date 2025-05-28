
import { supabase } from '@/integrations/supabase/client';

export interface StrategyResult {
  id?: string;
  user_id?: string;
  strategy_name: string;
  strategy_code: string;
  symbol: string;
  timeframe: string;
  win_rate: number;
  total_return: number;
  total_trades: number;
  profit_factor: number;
  max_drawdown: number;
  created_at?: string;
}

export class StrategyStorage {
  static async saveStrategyResult(result: Omit<StrategyResult, 'id' | 'created_at' | 'user_id'>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('strategy_results')
        .insert([{
          ...result,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving strategy result:', error);
        throw error;
      }

      console.log('Strategy result saved successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to save strategy result:', error);
      throw error;
    }
  }

  static async getStrategyResults(limit: number = 50) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('strategy_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching strategy results:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch strategy results:', error);
      throw error;
    }
  }

  static async getStrategyByName(strategyName: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('strategy_results')
        .select('*')
        .eq('strategy_name', strategyName)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching strategy by name:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch strategy by name:', error);
      throw error;
    }
  }
}
