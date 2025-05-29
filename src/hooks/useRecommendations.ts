
import { useState, useEffect } from 'react';
import { StrategyAnalyticsService, PersonalizedRecommendation } from '@/services/analytics';
import { provenStrategies } from '@/services/provenStrategies';

interface UserPreferences {
  symbol: string;
  timeframe: string;
  riskTolerance: 'low' | 'medium' | 'high';
  targetReturn: number;
}

export const useRecommendations = (userPreferences: UserPreferences) => {
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        
        // Get database recommendations (including user's own high-performing strategies)
        const dbRecs = await StrategyAnalyticsService.getPersonalizedRecommendations(userPreferences);
        
        // Get user's high-performing strategies
        const userHighPerformers = await StrategyAnalyticsService.getHighReturnStrategies(15, 60);
        
        // Convert user strategies to recommendations format
        const userRecs: PersonalizedRecommendation[] = userHighPerformers.map(strategy => {
          let score = 0;
          const matchFactors: string[] = [];

          // Bonus for being user's own strategy
          score += 35;
          matchFactors.push('Your own strategy');

          // Symbol matching
          if (strategy.symbol === userPreferences.symbol) {
            score += 40;
            matchFactors.push('Same currency pair');
          } else {
            score += 10;
            matchFactors.push('Different pair');
          }

          // Timeframe matching
          if (strategy.timeframe === userPreferences.timeframe) {
            score += 30;
            matchFactors.push('Same timeframe');
          } else {
            score += 15;
            matchFactors.push('Adaptable timeframe');
          }

          // High performance bonus
          if ((strategy.win_rate || 0) >= 60 && (strategy.total_return || 0) > 15) {
            score += 20;
            matchFactors.push('High performance');
          }

          return {
            strategy: {
              ...strategy,
              id: strategy.id || `user_${strategy.strategy_name}`
            },
            score,
            matchFactors
          };
        });

        // Add proven strategies with matching logic
        const provenRecs: PersonalizedRecommendation[] = provenStrategies.map(strategy => {
          let score = 0;
          const matchFactors: string[] = [];

          // Symbol matching
          if (strategy.symbol === userPreferences.symbol) {
            score += 40;
            matchFactors.push('Same currency pair');
          } else {
            score += 10; // Partial score for different pairs
            matchFactors.push('Different pair but proven');
          }

          // Timeframe matching
          if (strategy.timeframe === userPreferences.timeframe) {
            score += 30;
            matchFactors.push('Same timeframe');
          } else {
            score += 15; // Partial score
            matchFactors.push('Adaptable timeframe');
          }

          // Risk tolerance
          const drawdown = Math.abs(strategy.max_drawdown || 0);
          let riskLevel: 'low' | 'medium' | 'high' = 'medium';
          if (drawdown < 8) riskLevel = 'low';
          else if (drawdown > 15) riskLevel = 'high';

          if (riskLevel === userPreferences.riskTolerance) {
            score += 20;
            matchFactors.push('Matches risk tolerance');
          }

          // Performance bonus
          const returnScore = Math.min((strategy.total_return || 0) / userPreferences.targetReturn, 2) * 15;
          score += returnScore;

          // High win rate bonus
          if ((strategy.win_rate || 0) > 65) {
            score += 10;
            matchFactors.push('High win rate');
          }

          // Proven performance
          score += 25; // Bonus for being a proven strategy
          matchFactors.push('Proven performance');

          return {
            strategy: {
              ...strategy,
              id: strategy.id
            },
            score,
            matchFactors
          };
        });

        // Combine and sort by score, prioritizing user's strategies
        const allRecs = [...userRecs, ...dbRecs, ...provenRecs]
          .sort((a, b) => {
            // Prioritize user's own high-performing strategies
            const aIsUser = a.matchFactors.includes('Your own strategy');
            const bIsUser = b.matchFactors.includes('Your own strategy');
            
            if (aIsUser && !bIsUser) return -1;
            if (!aIsUser && bIsUser) return 1;
            
            return b.score - a.score;
          })
          .slice(0, 8); // Show top 8 recommendations

        setRecommendations(allRecs);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        // Fallback to just proven strategies if database fails
        const fallbackRecs: PersonalizedRecommendation[] = provenStrategies.map(strategy => ({
          strategy: { ...strategy, id: strategy.id },
          score: 75,
          matchFactors: ['Proven strategy', 'High performance']
        }));
        setRecommendations(fallbackRecs);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userPreferences]);

  return { recommendations, loading };
};
