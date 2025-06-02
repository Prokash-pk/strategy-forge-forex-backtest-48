
import React from 'react';
import RecommendationHeader from './recommendations/RecommendationHeader';
import NoRecommendationsCard from './recommendations/NoRecommendationsCard';
import RecommendationCard from './recommendations/RecommendationCard';
import PerformanceTips from './recommendations/PerformanceTips';
import { useRecommendationEngine } from './recommendations/useRecommendationEngine';
import { Button } from '@/components/ui/button';
import { RefreshCw, Shuffle, TrendingUp } from 'lucide-react';

interface StrategyRecommendationsTabProps {
  strategy: any;
  backtestResults?: any;
  onStrategyChange: (updates: any) => void;
  onStrategySelect: (strategy: any) => void;
  onAddToStrategy: (codeSnippet: string) => void;
  onTestReverseStrategy?: () => void;
  isReverseTestRunning?: boolean;
}

const StrategyRecommendationsTab: React.FC<StrategyRecommendationsTabProps> = ({
  strategy,
  backtestResults,
  onStrategyChange,
  onStrategySelect,
  onAddToStrategy,
  onTestReverseStrategy,
  isReverseTestRunning
}) => {
  const { recommendations } = useRecommendationEngine({ strategy, backtestResults, onStrategyChange });

  const handleAddCode = (codeSnippet: string) => {
    if (codeSnippet) {
      const enhancedCode = `${strategy.code}\n\n# Strategy Enhancement\n${codeSnippet}`;
      onStrategyChange({ code: enhancedCode });
    }
  };

  const handleOptimizeStrategy = () => {
    // Apply top recommendation automatically
    if (recommendations.length > 0) {
      const topRecommendation = recommendations[0];
      if (topRecommendation.action) {
        topRecommendation.action();
      } else if (topRecommendation.codeSnippet) {
        handleAddCode(topRecommendation.codeSnippet);
      }
    }
  };

  const handleRunOnNewSymbol = () => {
    // Switch to a different symbol for testing
    const symbols = ['GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'USDCHF=X', 'USDCAD=X'];
    const currentSymbol = strategy.symbol;
    const newSymbol = symbols.find(s => s !== currentSymbol) || symbols[0];
    
    onStrategyChange({ symbol: newSymbol });
  };

  const handleGenerateReverseStrategy = () => {
    if (onTestReverseStrategy) {
      onTestReverseStrategy();
    } else {
      // Toggle reverse signals
      onStrategyChange({ 
        reverseSignals: !strategy.reverseSignals,
        name: strategy.reverseSignals 
          ? strategy.name.replace(' (Reversed)', '') 
          : `${strategy.name} (Reversed)`
      });
    }
  };

  return (
    <div className="space-y-6">
      <RecommendationHeader />

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={handleOptimizeStrategy}
          disabled={recommendations.length === 0}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <TrendingUp className="h-4 w-4" />
          Auto-Optimize Strategy
        </Button>
        
        <Button
          onClick={handleRunOnNewSymbol}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Test on New Symbol
        </Button>
        
        <Button
          onClick={handleGenerateReverseStrategy}
          disabled={isReverseTestRunning}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Shuffle className="h-4 w-4" />
          {isReverseTestRunning ? 'Testing Reverse...' : 'Generate Reverse Strategy'}
        </Button>
      </div>

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
