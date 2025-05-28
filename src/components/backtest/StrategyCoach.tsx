
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Copy, TrendingUp, AlertTriangle, Target, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StrategyCoach as StrategyCoachService, StrategyAnalysis } from '@/services/strategyCoach';

interface StrategyCoachProps {
  results: any;
}

const StrategyCoach: React.FC<StrategyCoachProps> = ({ results }) => {
  const [analysis, setAnalysis] = useState<StrategyAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [openRecommendations, setOpenRecommendations] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  React.useEffect(() => {
    if (results && results.trades) {
      setIsAnalyzing(true);
      // Simulate analysis delay for better UX
      setTimeout(() => {
        const analysisResult = StrategyCoachService.analyzeBacktest(results);
        setAnalysis(analysisResult);
        setIsAnalyzing(false);
      }, 1500);
    }
  }, [results]);

  const toggleRecommendation = (id: string) => {
    const newOpen = new Set(openRecommendations);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenRecommendations(newOpen);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code snippet copied to clipboard",
    });
  };

  if (!results || !results.trades) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <Brain className="h-16 w-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">Strategy Coach</h3>
          <p className="text-slate-400">Run a backtest to get personalized strategy recommendations</p>
        </CardContent>
      </Card>
    );
  }

  if (isAnalyzing) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Analyzing Your Strategy...</h3>
          <p className="text-slate-400">Identifying patterns and generating recommendations</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'risk_management': return <AlertTriangle className="h-4 w-4" />;
      case 'entry_timing': return <TrendingUp className="h-4 w-4" />;
      case 'exit_strategy': return <Target className="h-4 w-4" />;
      case 'position_sizing': return <Brain className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Brain className="h-5 w-5 text-emerald-400" />
          Strategy Coach
        </CardTitle>
        <p className="text-slate-400 text-sm">
          AI-powered analysis and recommendations to improve your strategy performance
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="insights" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700">
            <TabsTrigger value="insights">Key Insights</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="patterns">Trade Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Performance Metrics */}
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-300">Performance Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Overtrading Risk</span>
                    <Badge variant={analysis.performanceMetrics.overtrading ? "destructive" : "default"} className="text-xs">
                      {analysis.performanceMetrics.overtrading ? "High" : "Normal"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Drawdown Risk</span>
                    <Badge 
                      variant={analysis.performanceMetrics.drawdownRisk === 'high' ? "destructive" : 
                              analysis.performanceMetrics.drawdownRisk === 'medium' ? "secondary" : "default"} 
                      className="text-xs"
                    >
                      {analysis.performanceMetrics.drawdownRisk}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Consistency Score</span>
                    <span className="text-white font-semibold">{analysis.performanceMetrics.consistency}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Loss Analysis */}
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-300">Loss Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-slate-400 text-sm">Major Loss Cause</span>
                    <p className="text-white text-sm mt-1">{analysis.lossAnalysis.majorLossCause}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">Average Loss Size</span>
                    <p className="text-red-400 font-semibold">${analysis.lossAnalysis.avgLossSize.toFixed(2)}</p>
                  </div>
                  {analysis.lossAnalysis.lossClusters.length > 0 && (
                    <div>
                      <span className="text-slate-400 text-sm">Loss Clusters</span>
                      {analysis.lossAnalysis.lossClusters.map((cluster, index) => (
                        <p key={index} className="text-yellow-400 text-xs mt-1">{cluster}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {analysis.recommendations.length === 0 ? (
              <Card className="bg-slate-700 border-slate-600 p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
                <p className="text-slate-300">Your strategy looks well-optimized!</p>
                <p className="text-slate-400 text-sm mt-1">No major improvements detected at this time.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {analysis.recommendations.map((rec) => (
                  <Card key={rec.id} className="bg-slate-700 border-slate-600">
                    <Collapsible 
                      open={openRecommendations.has(rec.id)}
                      onOpenChange={() => toggleRecommendation(rec.id)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="hover:bg-slate-600/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getCategoryIcon(rec.category)}
                              <div className="text-left">
                                <h3 className="text-white font-medium">{rec.title}</h3>
                                <p className="text-slate-400 text-sm">{rec.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(rec.priority)}>
                                {rec.priority}
                              </Badge>
                              <span className="text-emerald-400 text-sm font-medium">
                                +{rec.estimatedImprovement}%
                              </span>
                              {openRecommendations.has(rec.id) ? 
                                <ChevronUp className="h-4 w-4 text-slate-400" /> : 
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              }
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            <div className="bg-slate-800 p-3 rounded border border-slate-600">
                              <h4 className="text-slate-300 text-sm font-medium mb-2">Explanation</h4>
                              <p className="text-slate-400 text-sm">{rec.explanation}</p>
                            </div>
                            
                            {rec.codeSnippet && (
                              <div className="bg-slate-900 p-3 rounded border border-slate-600">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-slate-300 text-sm font-medium">Code Implementation</h4>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(rec.codeSnippet!)}
                                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </Button>
                                </div>
                                <pre className="text-slate-300 text-xs overflow-x-auto">
                                  <code>{rec.codeSnippet}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            {analysis.patterns.length === 0 ? (
              <Card className="bg-slate-700 border-slate-600 p-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                <p className="text-slate-300">No significant patterns detected</p>
                <p className="text-slate-400 text-sm mt-1">Your trading appears consistent across different conditions.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {analysis.patterns.map((pattern, index) => (
                  <Card key={index} className="bg-slate-700 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant={pattern.impact === 'positive' ? 'default' : 
                                      pattern.impact === 'negative' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {pattern.impact}
                            </Badge>
                            <span className="text-slate-400 text-sm">
                              {pattern.frequency} occurrences
                            </span>
                          </div>
                          <p className="text-white text-sm mb-1">{pattern.description}</p>
                          <p className="text-slate-400 text-xs">
                            Average return: ${pattern.avgReturn.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StrategyCoach;
