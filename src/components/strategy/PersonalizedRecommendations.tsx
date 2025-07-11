
import React from 'react';
import { PersonalizedRecommendation } from '@/services/analytics';
import { useRecommendations } from '@/hooks/useRecommendations';
import RecommendationCard from './RecommendationCard';
import { LoadingState, EmptyState } from './RecommendationStates';

interface PersonalizedRecommendationsProps {
  userPreferences: {
    symbol: string;
    timeframe: string;
    riskTolerance: 'low' | 'medium' | 'high';
    targetReturn: number;
  };
  onLoadStrategy: (strategy: any) => void;
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  userPreferences,
  onLoadStrategy
}) => {
  const { recommendations, loading } = useRecommendations(userPreferences);

  const handleLoadStrategy = (recommendation: PersonalizedRecommendation) => {
    // Completely replace the strategy with the selected one
    onLoadStrategy({
      name: recommendation.strategy.strategy_name,
      code: recommendation.strategy.strategy_code, // This will completely replace the Python code
      symbol: recommendation.strategy.symbol,
      timeframe: recommendation.strategy.timeframe
    });
  };

  if (loading) {
    return <LoadingState />;
  }

  if (recommendations.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Personalized Strategy Recommendations</h3>
        <p className="text-slate-400 text-sm">
          Based on your preferences: {userPreferences.symbol} • {userPreferences.timeframe} • {userPreferences.riskTolerance} risk
        </p>
        <p className="text-slate-300 text-xs mt-1">
          Including high-performing strategies from the community with 60%+ win rate and 15%+ returns
        </p>
      </div>

      {recommendations.map((rec, index) => (
        <RecommendationCard
          key={rec.strategy.id}
          recommendation={rec}
          index={index}
          onLoadStrategy={handleLoadStrategy}
        />
      ))}
    </div>
  );
};

export default PersonalizedRecommendations;
