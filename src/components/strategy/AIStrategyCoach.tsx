
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Wand2, TrendingUp, Shield, Target, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AIStrategyCoach as AIStrategyService, AIStrategyAnalysis } from '@/services/aiStrategyCoach';
import { StrategyCodeInsertion } from '@/services/strategyCodeInsertion';

interface AIStrategyCoachProps {
  strategy: any;
  backtestResults?: any;
  onStrategyUpdate: (updates: any) => void;
  onNavigateToConfiguration?: () => void;
}

const AIStrategyCoach: React.FC<AIStrategyCoachProps> = ({
  strategy,
  backtestResults,
  onStrategyUpdate,
  onNavigateToConfiguration
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIStrategyAnalysis | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { toast } = useToast();

  const handleAnalyzeStrategy = async () => {
    if (!strategy.code || !backtestResults) {
      toast({
        title: "Analysis Required",
        description: "Please run a backtest first to analyze your strategy",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('Starting AI strategy analysis...');
      const analysisResult = await AIStrategyService.analyzeStrategyWithAI(
        strategy.code,
        backtestResults
      );
      
      setAnalysis(analysisResult);
      
      toast({
        title: "Analysis Complete! 🧠",
        description: `Found ${analysisResult.recommendations.length} enhancement opportunities`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze strategy. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAutoEnhance = async () => {
    if (!analysis || analysis.recommendations.length === 0) {
      toast({
        title: "No Enhancements Available",
        description: "Run analysis first to find enhancement opportunities",
        variant: "destructive"
      });
      return;
    }

    setIsEnhancing(true);
    try {
      // Apply top 3 highest priority recommendations
      const topRecommendations = analysis.recommendations
        .filter(rec => rec.codeSnippet)
        .sort((a, b) => {
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        })
        .slice(0, 3);

      if (topRecommendations.length === 0) {
        toast({
          title: "No Code Enhancements",
          description: "Analysis found recommendations but no code improvements available",
          variant: "destructive"
        });
        return;
      }

      // Apply all enhancements
      const snippets = topRecommendations.map(rec => ({
        code: rec.codeSnippet!,
        title: rec.title
      }));

      const enhancedCode = StrategyCodeInsertion.insertMultipleSnippets(
        strategy.code,
        snippets
      );

      // Update strategy with enhanced code
      const enhancedStrategy = {
        ...strategy,
        code: enhancedCode,
        name: `${strategy.name} (AI Enhanced)`
      };

      onStrategyUpdate(enhancedStrategy);

      toast({
        title: "Strategy Enhanced! ✨",
        description: `Applied ${topRecommendations.length} AI recommendations. Redirecting to configuration...`,
      });

      // Clear analysis to encourage re-testing
      setAnalysis(null);

      // Navigate back to configuration tab after a short delay
      setTimeout(() => {
        if (onNavigateToConfiguration) {
          onNavigateToConfiguration();
        }
      }, 1500);

    } catch (error) {
      console.error('Enhancement failed:', error);
      toast({
        title: "Enhancement Failed",
        description: "Could not apply AI enhancements. Please try manually.",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500/10 text-red-400';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400';
      case 'low': return 'bg-green-500/10 text-green-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'risk_management': return Shield;
      case 'entry_timing': return Clock;
      case 'exit_strategy': return Target;
      case 'position_sizing': return TrendingUp;
      default: return Brain;
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Brain className="h-5 w-5 text-purple-400" />
          AI Strategy Coach
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!analysis ? (
          <div className="text-center space-y-4">
            <div className="bg-slate-700/50 p-6 rounded-lg">
              <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">AI Strategy Analysis</h3>
              <p className="text-slate-300 mb-4">
                Let our AI analyze your strategy performance and automatically suggest improvements
              </p>
              
              {backtestResults && (
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="bg-slate-800 p-3 rounded">
                    <div className="text-slate-400">Win Rate</div>
                    <div className="text-white font-medium">{backtestResults.winRate?.toFixed(1)}%</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded">
                    <div className="text-slate-400">Total Return</div>
                    <div className="text-white font-medium">{backtestResults.totalReturn?.toFixed(1)}%</div>
                  </div>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleAnalyzeStrategy}
              disabled={isAnalyzing || !backtestResults}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Analyzing Strategy...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze My Strategy
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Analysis Summary */}
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-3">Analysis Summary</h3>
              <p className="text-slate-300 mb-4">{analysis.overallAssessment}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="text-sm text-slate-400">Risk Level</div>
                  <Badge className={getRiskLevelColor(analysis.riskLevel)}>
                    {analysis.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-400">Complexity Score</div>
                  <div className="text-white font-medium">{analysis.complexityScore}/100</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-emerald-400 mb-1">Strengths Identified:</div>
                  <ul className="text-sm text-slate-300 space-y-1">
                    {analysis.strengthsIdentified.map((strength, i) => (
                      <li key={i}>• {strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium text-red-400 mb-1">Issues Found:</div>
                  <ul className="text-sm text-slate-300 space-y-1">
                    {analysis.weaknessesIdentified.map((weakness, i) => (
                      <li key={i}>• {weakness}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">AI Recommendations</h3>
                  <Button
                    onClick={handleAutoEnhance}
                    disabled={isEnhancing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isEnhancing ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Auto-Enhance Strategy
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-3">
                  {analysis.recommendations.slice(0, 5).map((rec, index) => {
                    const IconComponent = getCategoryIcon(rec.category);
                    return (
                      <div key={rec.id} className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-blue-400" />
                            <h4 className="font-medium text-white">{rec.title}</h4>
                          </div>
                          <div className="flex gap-2">
                            <Badge 
                              variant="secondary" 
                              className={`${
                                rec.priority === 'high' 
                                  ? 'bg-red-500/10 text-red-400' 
                                  : 'bg-yellow-500/10 text-yellow-400'
                              }`}
                            >
                              {rec.priority}
                            </Badge>
                            <Badge variant="outline" className="text-slate-300">
                              +{rec.estimatedImprovement}%
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{rec.description}</p>
                        <p className="text-xs text-slate-400">{rec.reasoning}</p>
                        
                        {rec.codeSnippet && (
                          <div className="mt-3 bg-slate-800 p-2 rounded text-xs text-slate-300 font-mono">
                            <div className="text-slate-400 mb-1">Enhancement Preview:</div>
                            <div className="truncate">{rec.codeSnippet.split('\n')[0]}...</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Button
              onClick={() => setAnalysis(null)}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Run New Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIStrategyCoach;
