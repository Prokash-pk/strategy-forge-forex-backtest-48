
import { supabase } from '@/integrations/supabase/client';
import { StrategyResult } from '../strategyStorage';
import { StrategyAnalytics, PerformanceAnalysis } from './types';

export class CoreAnalyticsService {
  static async getAnalytics(): Promise<StrategyAnalytics> {
    try {
      const { data: results, error } = await supabase
        .from('strategy_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const allResults = results || [];
      const highReturnTests = allResults.filter(
        result => (result.total_return || 0) > 15 || (result.win_rate || 0) > 60
      );

      const avgWinRate = allResults.length > 0 
        ? allResults.reduce((sum, r) => sum + (r.win_rate || 0), 0) / allResults.length
        : 0;

      const avgReturn = allResults.length > 0
        ? allResults.reduce((sum, r) => sum + (r.total_return || 0), 0) / allResults.length
        : 0;

      const topStrategies = [...allResults]
        .sort((a, b) => (b.total_return || 0) - (a.total_return || 0))
        .slice(0, 10);

      // Performance breakdown analysis
      const performanceBreakdown = {
        highWinRateHighReturn: allResults.filter(r => 
          (r.win_rate || 0) > 60 && (r.total_return || 0) > 15
        ).length,
        highWinRateLowReturn: allResults.filter(r => 
          (r.win_rate || 0) > 60 && (r.total_return || 0) <= 0
        ).length,
        lowWinRateHighReturn: allResults.filter(r => 
          (r.win_rate || 0) <= 50 && (r.total_return || 0) > 15
        ).length,
        lowWinRateLowReturn: allResults.filter(r => 
          (r.win_rate || 0) <= 50 && (r.total_return || 0) <= 0
        ).length,
      };

      return {
        totalTests: allResults.length,
        highReturnTests: highReturnTests.length,
        averageWinRate: Math.round(avgWinRate),
        averageReturn: Math.round(avgReturn),
        topStrategies,
        recentTests: allResults.slice(0, 20),
        performanceBreakdown
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      throw error;
    }
  }

  static async getPerformanceAnalysis(): Promise<PerformanceAnalysis> {
    try {
      const { data: results, error } = await supabase
        .from('strategy_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allResults = results || [];

      // Strategies with high win rate but negative returns (the issue you mentioned)
      const winRateVsReturnMismatch = allResults.filter(r => 
        (r.win_rate || 0) > 60 && (r.total_return || 0) < -50
      );

      // Consistent performers (good win rate AND positive returns)
      const consistentPerformers = allResults.filter(r => 
        (r.win_rate || 0) > 55 && (r.total_return || 0) > 10
      );

      // Underperformers (low win rate AND negative returns)
      const underPerformers = allResults.filter(r => 
        (r.win_rate || 0) < 40 && (r.total_return || 0) < -20
      );

      return {
        winRateVsReturnMismatch,
        consistentPerformers,
        underPerformers
      };
    } catch (error) {
      console.error('Failed to get performance analysis:', error);
      throw error;
    }
  }
}
