
import { supabase } from '@/integrations/supabase/client';

export class DatabaseOptimizer {
  // Archive old trading logs to reduce query load
  static async archiveOldTradingLogs(daysToKeep: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      console.log(`🗄️ Archiving trading logs older than ${daysToKeep} days...`);
      
      // First count the records we're going to delete
      const { count } = await supabase
        .from('trading_logs')
        .select('*', { count: 'exact', head: true })
        .lt('timestamp', cutoffDate.toISOString());
      
      // Then delete them
      const { error } = await supabase
        .from('trading_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());
      
      if (error) {
        console.error('❌ Failed to archive logs:', error);
        return 0;
      }
      
      const archivedCount = count || 0;
      console.log(`✅ Archived ${archivedCount} old trading logs`);
      return archivedCount;
      
    } catch (error) {
      console.error('❌ Archive operation failed:', error);
      return 0;
    }
  }

  // Get trading logs with pagination to reduce data transfer
  static async getTradingLogsPaginated(
    limit: number = 20, 
    offset: number = 0
  ): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('trading_logs')
        .select('id, log_type, message, timestamp, trade_data')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Failed to fetch paginated logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Paginated query failed:', error);
      return [];
    }
  }

  // Get only essential trading session data
  static async getEssentialTradingSessions(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('trading_sessions')
        .select('id, strategy_name, symbol, environment, is_active, created_at, last_execution')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch essential sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Essential sessions query failed:', error);
      return [];
    }
  }

  // Clean up inactive sessions
  static async cleanupInactiveSessions(daysInactive: number = 1): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      console.log(`🧹 Cleaning up sessions inactive for ${daysInactive} days...`);

      // First count the records we're going to update
      const { count } = await supabase
        .from('trading_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true)
        .lt('last_execution', cutoffDate.toISOString());

      // Then update them
      const { error } = await supabase
        .from('trading_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true)
        .lt('last_execution', cutoffDate.toISOString());

      if (error) {
        console.error('❌ Failed to cleanup sessions:', error);
        return 0;
      }

      const cleanedCount = count || 0;
      console.log(`✅ Cleaned up ${cleanedCount} inactive sessions`);
      return cleanedCount;

    } catch (error) {
      console.error('❌ Session cleanup failed:', error);
      return 0;
    }
  }

  // Optimize strategy results storage
  static async getLatestStrategyResults(limit: number = 10): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('strategy_results')
        .select('id, strategy_name, symbol, win_rate, total_return, total_trades, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Failed to fetch strategy results:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Strategy results query failed:', error);
      return [];
    }
  }

  // Run daily optimization
  static async runDailyOptimization(): Promise<void> {
    console.log('🔧 Running daily database optimization...');
    
    try {
      const archivedLogs = await this.archiveOldTradingLogs(7);
      const cleanedSessions = await this.cleanupInactiveSessions(1);
      
      console.log('✅ Daily optimization complete:', {
        archivedLogs,
        cleanedSessions
      });
    } catch (error) {
      console.error('❌ Daily optimization failed:', error);
    }
  }
}

// Auto-run optimization daily
if (typeof window !== 'undefined') {
  (window as any).databaseOptimizer = DatabaseOptimizer;
  (window as any).runDatabaseOptimization = () => DatabaseOptimizer.runDailyOptimization();
  
  // Run optimization once per day
  const lastOptimization = localStorage.getItem('lastDbOptimization');
  const today = new Date().toDateString();
  
  if (lastOptimization !== today) {
    setTimeout(() => {
      DatabaseOptimizer.runDailyOptimization();
      localStorage.setItem('lastDbOptimization', today);
    }, 60000); // Run after 1 minute
  }
}
