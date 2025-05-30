
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AIStrategyCoach as AIStrategyService, AIStrategyAnalysis } from '@/services/aiStrategyCoach';
import { StrategyCodeInsertion } from '@/services/strategyCodeInsertion';
import AnalysisSummary from './ai-coach/AnalysisSummary';
import RecommendationCard from './ai-coach/RecommendationCard';
import InitialAnalysisView from './ai-coach/InitialAnalysisView';

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
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set());
  const [applyingRecommendation, setApplyingRecommendation] = useState<string | null>(null);
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

  const handleQuickAdd = async (recommendation: any) => {
    if (!recommendation.codeSnippet) {
      toast({
        title: "No Code Available",
        description: "This recommendation doesn't have executable code",
        variant: "destructive"
      });
      return;
    }

    if (appliedRecommendations.has(recommendation.id)) {
      toast({
        title: "Already Applied",
        description: "This recommendation has already been added to your strategy",
        variant: "destructive"
      });
      return;
    }

    setApplyingRecommendation(recommendation.id);
    try {
      console.log('Applying individual recommendation:', recommendation.title);
      
      const enhancedCode = StrategyCodeInsertion.insertCodeSnippet(
        strategy.code,
        recommendation.codeSnippet,
        recommendation.title
      );

      const enhancedStrategy = {
        ...strategy,
        code: enhancedCode
      };

      onStrategyUpdate(enhancedStrategy);
      setAppliedRecommendations(prev => new Set([...prev, recommendation.id]));

      toast({
        title: "Recommendation Applied! ✨",
        description: `"${recommendation.title}" has been added to your strategy`,
      });

      setTimeout(() => {
        if (onNavigateToConfiguration) {
          onNavigateToConfiguration();
        }
      }, 1000);

    } catch (error) {
      console.error('Failed to apply recommendation:', error);
      toast({
        title: "Application Failed",
        description: "Could not apply this recommendation. Please try manually.",
        variant: "destructive"
      });
    } finally {
      setApplyingRecommendation(null);
    }
  };

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `"${title}" code copied to clipboard`,
    });
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

      const snippets = topRecommendations.map(rec => ({
        code: rec.codeSnippet!,
        title: rec.title
      }));

      const enhancedCode = StrategyCodeInsertion.insertMultipleSnippets(
        strategy.code,
        snippets
      );

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

      setAnalysis(null);

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
          <InitialAnalysisView
            backtestResults={backtestResults}
            isAnalyzing={isAnalyzing}
            onAnalyzeStrategy={handleAnalyzeStrategy}
          />
        ) : (
          <div className="space-y-6">
            <AnalysisSummary analysis={analysis} />

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
                  {analysis.recommendations.slice(0, 5).map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      isApplied={appliedRecommendations.has(rec.id)}
                      isApplying={applyingRecommendation === rec.id}
                      onQuickAdd={handleQuickAdd}
                      onCopyToClipboard={copyToClipboard}
                    />
                  ))}
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
