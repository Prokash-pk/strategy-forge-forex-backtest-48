
import { supabase } from '@/integrations/supabase/client';
import { PersonalizedRecommendation, UserPreferences } from './types';
import { PROVEN_STRATEGIES } from './provenStrategies';

export class RecommendationsService {
  static async getPersonalizedRecommendations(userPreferences: UserPreferences): Promise<PersonalizedRecommendation[]> {
    try {
      // Get current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // Fetch high-performing strategies from all users
      const { data: results, error } = await supabase
        .from('strategy_results')
        .select('*')
        .gte('total_return', 15) // Minimum 15% return
        .gte('win_rate', 60) // Minimum 60% win rate
        .gte('total_trades', 10) // Minimum 10 trades for statistical significance
        .order('total_return', { ascending: false })
        .limit(100);

      if (error) throw error;

      const strategies = results || [];
      const recommendations: PersonalizedRecommendation[] = [];

      // Add proven strategies first
      for (const provenStrategy of PROVEN_STRATEGIES) {
        let score = 0;
        const matchFactors: string[] = [];

        // High base score for proven strategies
        score += 50;
        matchFactors.push('Proven community strategy');

        // Exact symbol match gets highest score
        if (provenStrategy.symbol === userPreferences.symbol) {
          score += 35;
          matchFactors.push('Same currency pair');
        } else {
          score += 15; // Partial score for different pairs
          matchFactors.push('Adaptable to your pair');
        }

        // Timeframe match
        if (provenStrategy.timeframe === userPreferences.timeframe) {
          score += 25;
          matchFactors.push('Perfect timeframe match');
        } else {
          score += 10; // Partial score
          matchFactors.push('Adaptable timeframe');
        }

        // Risk tolerance matching
        const riskLevel = this.calculateRiskLevel(Math.abs(provenStrategy.max_drawdown), provenStrategy.total_return);
        
        if (riskLevel === userPreferences.riskTolerance) {
          score += 20;
          matchFactors.push('Matches risk tolerance');
        }

        // Performance bonuses
        if (provenStrategy.win_rate >= 70) {
          score += 20;
          matchFactors.push('Excellent win rate');
        } else if (provenStrategy.win_rate >= 60) {
          score += 15;
          matchFactors.push('Good win rate');
        }

        if (provenStrategy.total_trades >= 100) {
          score += 15;
          matchFactors.push('Extensively tested');
        } else if (provenStrategy.total_trades >= 50) {
          score += 10;
          matchFactors.push('Well tested');
        }

        recommendations.push({
          strategy: provenStrategy,
          score,
          matchFactors
        });
      }

      // Add user strategies from database
      for (const strategy of strategies) {
        let score = 0;
        const matchFactors: string[] = [];

        // Check if this is user's own strategy
        const isOwnStrategy = strategy.user_id === currentUserId;
        if (isOwnStrategy) {
          score += 40;
          matchFactors.push('Your own strategy');
        } else {
          score += 25; // Bonus for community strategies
          matchFactors.push('Community favorite');
        }

        // Exact symbol match gets highest score
        if (strategy.symbol === userPreferences.symbol) {
          score += 35;
          matchFactors.push('Same currency pair');
        } else {
          score += 10; // Partial score for different pairs
          matchFactors.push('Different pair');
        }

        // Timeframe match
        if (strategy.timeframe === userPreferences.timeframe) {
          score += 25;
          matchFactors.push('Same timeframe');
        } else {
          score += 10; // Partial score
          matchFactors.push('Adaptable timeframe');
        }

        // Risk tolerance matching based on max drawdown
        const drawdown = Math.abs(strategy.max_drawdown || 0);
        const riskLevel = this.calculateRiskLevel(drawdown, strategy.total_return || 0);
        
        if (riskLevel === userPreferences.riskTolerance) {
          score += 20;
          matchFactors.push('Matches risk tolerance');
        }

        // High performance bonuses
        const returnScore = Math.min((strategy.total_return || 0) / userPreferences.targetReturn, 2) * 15;
        score += returnScore;

        if ((strategy.win_rate || 0) >= 70) {
          score += 15;
          matchFactors.push('Excellent win rate');
        } else if ((strategy.win_rate || 0) >= 60) {
          score += 10;
          matchFactors.push('Good win rate');
        }

        // Trade count bonus (more trades = more reliable)
        if ((strategy.total_trades || 0) >= 50) {
          score += 10;
          matchFactors.push('Well-tested');
        } else if ((strategy.total_trades || 0) >= 20) {
          score += 5;
          matchFactors.push('Adequately tested');
        }

        if (score > 40) { // Only include strategies with decent matching score
          recommendations.push({
            strategy: {
              ...strategy,
              id: strategy.id || `strategy_${strategy.strategy_name}`
            },
            score,
            matchFactors
          });
        }
      }

      return recommendations
        .sort((a, b) => {
          // Prioritize user's own strategies first
          const aIsOwn = a.matchFactors.includes('Your own strategy');
          const bIsOwn = b.matchFactors.includes('Your own strategy');
          
          if (aIsOwn && !bIsOwn) return -1;
          if (!aIsOwn && bIsOwn) return 1;
          
          return b.score - a.score;
        })
        .slice(0, 12); // Show top 12 recommendations

    } catch (error) {
      console.error('Failed to get personalized recommendations:', error);
      throw error;
    }
  }

  private static calculateRiskLevel(maxDrawdown: number, totalReturn: number): 'low' | 'medium' | 'high' {
    const volatility = maxDrawdown / Math.abs(totalReturn || 1);
    
    if (maxDrawdown < 8 && volatility < 0.4) return 'low';
    if (maxDrawdown < 15 && volatility < 0.8) return 'medium';
    return 'high';
  }
}
