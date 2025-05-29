
import { useState, useEffect } from 'react';
import { StrategyAnalyticsService, PersonalizedRecommendation } from '@/services/analytics';

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
        
        // Get personalized recommendations (now includes community strategies)
        const recs = await StrategyAnalyticsService.getPersonalizedRecommendations(userPreferences);
        
        setRecommendations(recs);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userPreferences]);

  return { recommendations, loading };
};
