
import React from 'react';
import AIStrategyRecommendations from './AIStrategyRecommendations';
import PersonalizedRecommendations from './PersonalizedRecommendations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp } from 'lucide-react';

interface HighPerformanceStrategiesTabProps {
  onStrategyChange: (strategy: any) => void;
}

const HighPerformanceStrategiesTab: React.FC<HighPerformanceStrategiesTabProps> = ({
  onStrategyChange
}) => {
  const userPreferences = {
    symbol: 'EURUSD=X',
    timeframe: '5m',
    riskTolerance: 'high' as const,
    targetReturn: 200
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="ai-strategies" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700">
          <TabsTrigger value="ai-strategies">
            <Sparkles className="h-4 w-4 mr-2" />
            AI 200%+ Strategies
          </TabsTrigger>
          <TabsTrigger value="community-high">
            <TrendingUp className="h-4 w-4 mr-2" />
            High-Performance Community
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-strategies">
          <AIStrategyRecommendations onLoadStrategy={onStrategyChange} />
        </TabsContent>

        <TabsContent value="community-high">
          <PersonalizedRecommendations 
            userPreferences={userPreferences}
            onLoadStrategy={onStrategyChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HighPerformanceStrategiesTab;
