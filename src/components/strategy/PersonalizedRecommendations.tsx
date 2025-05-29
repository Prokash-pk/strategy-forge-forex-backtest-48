
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Users, Star, CheckCircle } from 'lucide-react';
import { StrategyAnalyticsService, PersonalizedRecommendation } from '@/services/strategyAnalytics';

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
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const recs = await StrategyAnalyticsService.getPersonalizedRecommendations(userPreferences);
        setRecommendations(recs);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userPreferences]);

  const handleLoadStrategy = (recommendation: PersonalizedRecommendation) => {
    onLoadStrategy({
      name: recommendation.strategy.strategy_name,
      code: recommendation.strategy.strategy_code,
      symbol: recommendation.strategy.symbol,
      timeframe: recommendation.strategy.timeframe
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-slate-400';
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-400 border-green-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="bg-slate-700 border-slate-600">
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-300 mb-2">No matching strategies found</p>
          <p className="text-slate-400 text-sm">
            Try adjusting your target return or risk tolerance to see more recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Personalized Strategy Recommendations</h3>
        <p className="text-slate-400 text-sm">
          Based on your preferences: {userPreferences.symbol} • {userPreferences.timeframe} • {userPreferences.riskTolerance} risk
        </p>
      </div>

      {recommendations.map((rec, index) => (
        <Card key={rec.strategy.id} className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-slate-400">#{index + 1}</span>
                </div>
                <div>
                  <CardTitle className="text-white text-lg">{rec.strategy.strategy_name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-400 text-sm">{rec.strategy.symbol} • {rec.strategy.timeframe}</span>
                    <div className={`text-sm font-medium ${getScoreColor(rec.score)}`}>
                      {rec.score.toFixed(0)}% match
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="text-center">
                <div className={`font-bold text-lg ${(rec.strategy.total_return || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {rec.strategy.total_return?.toFixed(1)}%
                </div>
                <div className="text-slate-500 text-xs">Total Return</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-blue-400">{rec.strategy.win_rate?.toFixed(1)}%</div>
                <div className="text-slate-500 text-xs">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-slate-300">{rec.strategy.total_trades}</div>
                <div className="text-slate-500 text-xs">Trades</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-orange-400">{Math.abs(rec.strategy.max_drawdown || 0).toFixed(1)}%</div>
                <div className="text-slate-500 text-xs">Max DD</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {rec.matchFactors.map((factor, i) => (
                <Badge key={i} className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {factor}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-slate-400 text-sm">
                Tested {new Date(rec.strategy.created_at || '').toLocaleDateString()}
              </div>
              <Button
                onClick={() => handleLoadStrategy(rec)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Load Strategy
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PersonalizedRecommendations;
