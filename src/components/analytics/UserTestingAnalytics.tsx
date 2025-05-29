
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Trophy, Target, Eye, Filter } from 'lucide-react';
import { StrategyStorage, StrategyResult } from '@/services/strategyStorage';
import { useToast } from '@/hooks/use-toast';

const UserTestingAnalytics: React.FC = () => {
  const [allResults, setAllResults] = useState<StrategyResult[]>([]);
  const [highReturnResults, setHighReturnResults] = useState<StrategyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const results = await StrategyStorage.getStrategyResults(100); // Get more results for analytics
      
      setAllResults(results || []);
      
      // Filter high-return strategies (>15% return or >60% win rate)
      const highReturn = (results || []).filter(
        result => result.total_return > 15 || result.win_rate > 60
      );
      setHighReturnResults(highReturn);
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({
        title: "Failed to Load Analytics",
        description: "Could not load user testing data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceBadge = (result: StrategyResult) => {
    if (result.total_return > 20 && result.win_rate > 65) {
      return <Badge className="bg-green-600">Excellent</Badge>;
    } else if (result.total_return > 10 && result.win_rate > 55) {
      return <Badge className="bg-blue-600">Good</Badge>;
    } else if (result.total_return > 0) {
      return <Badge className="bg-yellow-600">Average</Badge>;
    } else {
      return <Badge className="bg-red-600">Poor</Badge>;
    }
  };

  const topStrategies = [...allResults]
    .sort((a, b) => (b.total_return || 0) - (a.total_return || 0))
    .slice(0, 10);

  const topWinRateStrategies = [...allResults]
    .sort((a, b) => (b.win_rate || 0) - (a.win_rate || 0))
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Testing Analytics</h2>
          <p className="text-slate-400">Track strategy performance and user testing results</p>
        </div>
        <Button onClick={loadAnalytics} variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-slate-400 text-sm">Total Tests</p>
                <p className="text-white text-xl font-bold">{allResults.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-slate-400 text-sm">High Return Tests</p>
                <p className="text-white text-xl font-bold">{highReturnResults.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-slate-400 text-sm">Avg Win Rate</p>
                <p className="text-white text-xl font-bold">
                  {allResults.length > 0 
                    ? Math.round(allResults.reduce((sum, r) => sum + (r.win_rate || 0), 0) / allResults.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-slate-400 text-sm">Avg Return</p>
                <p className="text-white text-xl font-bold">
                  {allResults.length > 0 
                    ? Math.round(allResults.reduce((sum, r) => sum + (r.total_return || 0), 0) / allResults.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800">
          <TabsTrigger value="all">All Results</TabsTrigger>
          <TabsTrigger value="top-return">Top Returns</TabsTrigger>
          <TabsTrigger value="top-winrate">Top Win Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">All Strategy Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{result.strategy_name}</h4>
                      <p className="text-slate-400 text-sm">{result.symbol} • {result.timeframe}</p>
                      <p className="text-slate-500 text-xs">{new Date(result.created_at || '').toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-emerald-400 font-bold">{result.total_return?.toFixed(1)}%</p>
                        <p className="text-slate-500 text-xs">Return</p>
                      </div>
                      <div className="text-center">
                        <p className="text-blue-400 font-bold">{result.win_rate?.toFixed(1)}%</p>
                        <p className="text-slate-500 text-xs">Win Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold">{result.total_trades}</p>
                        <p className="text-slate-500 text-xs">Trades</p>
                      </div>
                      {getPerformanceBadge(result)}
                    </div>
                  </div>
                ))}
                {allResults.length === 0 && (
                  <p className="text-slate-400 text-center py-8">No strategy tests found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-return">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Top Performing Strategies by Return
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topStrategies.map((result, index) => (
                  <div key={result.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{result.strategy_name}</h4>
                        <p className="text-slate-400 text-sm">{result.symbol} • {result.timeframe}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-emerald-400 font-bold text-lg">{result.total_return?.toFixed(1)}%</p>
                        <p className="text-slate-500 text-xs">Return</p>
                      </div>
                      <div className="text-center">
                        <p className="text-blue-400 font-bold">{result.win_rate?.toFixed(1)}%</p>
                        <p className="text-slate-500 text-xs">Win Rate</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-winrate">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-400" />
                Top Performing Strategies by Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topWinRateStrategies.map((result, index) => (
                  <div key={result.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{result.strategy_name}</h4>
                        <p className="text-slate-400 text-sm">{result.symbol} • {result.timeframe}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-blue-400 font-bold text-lg">{result.win_rate?.toFixed(1)}%</p>
                        <p className="text-slate-500 text-xs">Win Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-emerald-400 font-bold">{result.total_return?.toFixed(1)}%</p>
                        <p className="text-slate-500 text-xs">Return</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserTestingAnalytics;
