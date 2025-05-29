
import { supabase } from '@/integrations/supabase/client';
import { PersonalizedRecommendation, UserPreferences } from './types';

export class RecommendationsService {
  static async getPersonalizedRecommendations(userPreferences: UserPreferences): Promise<PersonalizedRecommendation[]> {
    try {
      const { data: results, error } = await supabase
        .from('strategy_results')
        .select('*')
        .gte('total_return', userPreferences.targetReturn * 0.7) // At least 70% of target return
        .gte('win_rate', 45) // Minimum viable win rate
        .order('total_return', { ascending: false })
        .limit(50);

      if (error) throw error;

      const strategies = results || [];
      const recommendations: PersonalizedRecommendation[] = [];

      for (const strategy of strategies) {
        let score = 0;
        const matchFactors: string[] = [];

        // Exact symbol match gets highest score
        if (strategy.symbol === userPreferences.symbol) {
          score += 40;
          matchFactors.push('Same currency pair');
        }

        // Timeframe match
        if (strategy.timeframe === userPreferences.timeframe) {
          score += 30;
          matchFactors.push('Same timeframe');
        }

        // Risk tolerance matching based on max drawdown and return volatility
        const drawdown = Math.abs(strategy.max_drawdown || 0);
        const riskLevel = this.calculateRiskLevel(drawdown, strategy.total_return || 0);
        
        if (riskLevel === userPreferences.riskTolerance) {
          score += 20;
          matchFactors.push('Matches risk tolerance');
        }

        // Return performance bonus
        const returnScore = Math.min((strategy.total_return || 0) / userPreferences.targetReturn, 2) * 10;
        score += returnScore;

        // Win rate bonus
        const winRateBonus = Math.min((strategy.win_rate || 0) / 60, 1) * 15;
        score += winRateBonus;

        if (score > 30) { // Only include strategies with decent matching score
          recommendations.push({
            strategy,
            score,
            matchFactors
          });
        }
      }

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    } catch (error) {
      console.error('Failed to get personalized recommendations:', error);
      throw error;
    }
  }

  private static calculateRiskLevel(maxDrawdown: number, totalReturn: number): 'low' | 'medium' | 'high' {
    const volatility = maxDrawdown / Math.abs(totalReturn || 1);
    
    if (maxDrawdown < 10 && volatility < 0.5) return 'low';
    if (maxDrawdown < 25 && volatility < 1) return 'medium';
    return 'high';
  }
}
