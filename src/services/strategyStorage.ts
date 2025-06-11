
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
      console.log('💾 Saving strategy result...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated for strategy save');
        throw new Error('User not authenticated');
      }

      console.log('👤 User authenticated, proceeding with save:', user.id);

      const strategyData = {
        ...result,
        user_id: user.id
      };

      console.log('📤 Inserting strategy data:', {
        strategy_name: strategyData.strategy_name,
        symbol: strategyData.symbol,
        user_id: strategyData.user_id
      });

      const { data, error } = await supabase
        .from('strategy_results')
        .insert([strategyData])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error saving strategy:', error);
        throw error;
      }

      console.log('✅ Strategy result saved successfully:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Failed to save strategy result:', error);
      throw error;
    }
  }

  static async getStrategyResults(limit: number = 50) {
    try {
      console.log('📖 Fetching strategy results...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated for strategy fetch');
        throw new Error('User not authenticated');
      }

      console.log('👤 User authenticated, fetching strategies for:', user.id);

      const { data, error } = await supabase
        .from('strategy_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Database error fetching strategies:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} strategy results`);
      return data || [];
    } catch (error) {
      console.error('❌ Failed to fetch strategy results:', error);
      throw error;
    }
  }

  static async getStrategyByName(strategyName: string) {
    try {
      console.log('🔍 Fetching strategy by name:', strategyName);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated for strategy lookup');
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('strategy_results')
        .select('*')
        .eq('strategy_name', strategyName)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Database error fetching strategy by name:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} strategies with name "${strategyName}"`);
      return data || [];
    } catch (error) {
      console.error('❌ Failed to fetch strategy by name:', error);
      throw error;
    }
  }

  static async ensureUserCanSaveStrategies() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('⚠️ No authenticated user found');
        return false;
      }

      // Test if we can write to the strategy_results table
      const testData = {
        strategy_name: 'Test Strategy',
        strategy_code: 'test',
        symbol: 'EURUSD',
        timeframe: 'M15',
        win_rate: 0,
        total_return: 0,
        total_trades: 0,
        profit_factor: 0,
        max_drawdown: 0,
        user_id: user.id
      };

      const { error } = await supabase
        .from('strategy_results')
        .insert([testData])
        .select()
        .single();

      if (error) {
        console.error('❌ User cannot save strategies:', error);
        return false;
      }

      // Clean up test data
      await supabase
        .from('strategy_results')
        .delete()
        .eq('strategy_name', 'Test Strategy')
        .eq('user_id', user.id);

      console.log('✅ User can save strategies');
      return true;
    } catch (error) {
      console.error('❌ Error checking strategy save capability:', error);
      return false;
    }
  }
}
