
import React from 'react';
import RecommendationHeader from './recommendations/RecommendationHeader';
import NoRecommendationsCard from './recommendations/NoRecommendationsCard';
import RecommendationCard from './recommendations/RecommendationCard';
import PerformanceTips from './recommendations/PerformanceTips';
import { useRecommendationEngine } from './recommendations/useRecommendationEngine';

interface StrategyRecommendationsTabProps {
  strategy: any;
  backtestResults?: any;
  onStrategyChange: (updates: any) => void;
}

const StrategyRecommendationsTab: React.FC<StrategyRecommendationsTabProps> = ({
  strategy,
  backtestResults,
  onStrategyChange
}) => {
  const { recommendations } = useRecommendationEngine({ strategy, backtestResults, onStrategyChange });

  const handleAddCode = (codeSnippet: string) => {
    const enhancedCode = `${strategy.code}\n\n# Strategy Enhancement\n${codeSnippet}`;
    onStrategyChange({ code: enhancedCode });
  };

  return (
    <div className="space-y-6">
      <RecommendationHeader />

      {recommendations.length === 0 ? (
        <NoRecommendationsCard />
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onAddCode={handleAddCode}
            />
          ))}
        </div>
      )}

      <PerformanceTips />
    </div>
  );
};

export default StrategyRecommendationsTab;
