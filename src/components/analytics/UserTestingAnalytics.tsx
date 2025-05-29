
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StrategyAnalyticsService, StrategyAnalytics } from '@/services/strategyAnalytics';
import { TrendingUp, TrendingDown, AlertCircle, Target, Users, BarChart3 } from 'lucide-react';

const UserTestingAnalytics = () => {
  const [analytics, setAnalytics] = useState<StrategyAnalytics | null>(null);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [analyticsData, performanceData] = await Promise.all([
          StrategyAnalyticsService.getAnalytics(),
          StrategyAnalyticsService.getPerformanceAnalysis()
        ]);
        setAnalytics(analyticsData);
        setPerformanceAnalysis(performanceData);
      } catch (err) {
        setError('Failed to load analytics data');
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center text-red-400 p-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4" />
        <p>{error || 'No analytics data available'}</p>
      </div>
    );
  }

  const getPerformanceColor = (winRate: number, totalReturn: number) => {
    if (winRate > 60 && totalReturn > 15) return 'text-green-400';
    if (winRate > 60 && totalReturn < 0) return 'text-orange-400';
    if (totalReturn < -50) return 'text-red-400';
    return 'text-slate-400';
  };

  const getPerformanceLabel = (winRate: number, totalReturn: number) => {
    if (winRate > 60 && totalReturn > 15) return 'Excellent';
    if (winRate > 60 && totalReturn < 0) return 'High Win Rate, Low Return';
    if (totalReturn < -50) return 'Poor Performance';
    if (totalReturn > 15) return 'Good Return';
    return 'Average';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Strategy Testing Analytics</h2>
        <p className="text-slate-400">Comprehensive analysis of user strategy performance</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Tests</CardTitle>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.totalTests}</div>
            <p className="text-xs text-slate-400">Strategies tested</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">High Return Tests</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{analytics.highReturnTests}</div>
            <p className="text-xs text-slate-400">
              {analytics.totalTests > 0 ? Math.round((analytics.highReturnTests / analytics.totalTests) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Avg Win Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{analytics.averageWinRate}%</div>
            <p className="text-xs text-slate-400">Average across all tests</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Avg Return</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.averageReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {analytics.averageReturn}%
            </div>
            <p className="text-xs text-slate-400">Average total return</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Breakdown */}
      <Card className="bg-slate-700 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white">Performance Analysis</CardTitle>
          <p className="text-slate-400 text-sm">Understanding why high win rate doesn't always mean high returns</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-800 rounded">
              <div className="text-lg font-bold text-green-400">{analytics.performanceBreakdown.highWinRateHighReturn}</div>
              <div className="text-xs text-slate-400">High Win Rate + High Return</div>
            </div>
            <div className="text-center p-3 bg-slate-800 rounded">
              <div className="text-lg font-bold text-orange-400">{analytics.performanceBreakdown.highWinRateLowReturn}</div>
              <div className="text-xs text-slate-400">High Win Rate + Low Return</div>
            </div>
            <div className="text-center p-3 bg-slate-800 rounded">
              <div className="text-lg font-bold text-blue-400">{analytics.performanceBreakdown.lowWinRateHighReturn}</div>
              <div className="text-xs text-slate-400">Low Win Rate + High Return</div>
            </div>
            <div className="text-center p-3 bg-slate-800 rounded">
              <div className="text-lg font-bold text-red-400">{analytics.performanceBreakdown.lowWinRateLowReturn}</div>
              <div className="text-xs text-slate-400">Low Win Rate + Low Return</div>
            </div>
          </div>
          
          {analytics.performanceBreakdown.highWinRateLowReturn > 0 && (
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-orange-300 font-medium">Win Rate vs Return Discrepancy Detected</p>
                  <p className="text-orange-200 mt-1">
                    {analytics.performanceBreakdown.highWinRateLowReturn} strategies show high win rates but poor returns. 
                    This typically happens when losing trades are much larger than winning trades, or when transaction costs eat into profits.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="top-strategies" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800">
          <TabsTrigger value="top-strategies">Top Strategies</TabsTrigger>
          <TabsTrigger value="recent-tests">Recent Tests</TabsTrigger>
          <TabsTrigger value="problem-analysis">Problem Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="top-strategies">
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Top Performing Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topStrategies.slice(0, 10).map((strategy, index) => (
                  <div key={strategy.id} className="flex items-center justify-between p-3 bg-slate-800 rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">#{index + 1}</span>
                        <span className="text-white font-medium">{strategy.strategy_name}</span>
                        <Badge className={`${getPerformanceColor(strategy.win_rate || 0, strategy.total_return || 0)} bg-slate-600`}>
                          {getPerformanceLabel(strategy.win_rate || 0, strategy.total_return || 0)}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        {strategy.symbol} • {strategy.timeframe} • {strategy.total_trades} trades
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${(strategy.total_return || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {strategy.total_return?.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">
                        {strategy.win_rate?.toFixed(1)}% win rate
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent-tests">
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Recent Strategy Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentTests.map((strategy, index) => (
                  <div key={strategy.id} className="flex items-center justify-between p-3 bg-slate-800 rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{strategy.strategy_name}</span>
                        <Badge className={`${getPerformanceColor(strategy.win_rate || 0, strategy.total_return || 0)} bg-slate-600`}>
                          {getPerformanceLabel(strategy.win_rate || 0, strategy.total_return || 0)}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        {strategy.symbol} • {strategy.timeframe} • {new Date(strategy.created_at || '').toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${(strategy.total_return || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {strategy.total_return?.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">
                        {strategy.win_rate?.toFixed(1)}% win • {strategy.total_trades} trades
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="problem-analysis">
          <div className="space-y-4">
            {performanceAnalysis?.winRateVsReturnMismatch.length > 0 && (
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-orange-400">High Win Rate, Poor Returns</CardTitle>
                  <p className="text-slate-400 text-sm">
                    These strategies win often but lose money overall - typical signs of poor risk management
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {performanceAnalysis.winRateVsReturnMismatch.slice(0, 5).map((strategy: any) => (
                      <div key={strategy.id} className="flex justify-between items-center p-2 bg-slate-800 rounded">
                        <span className="text-white">{strategy.strategy_name}</span>
                        <div className="text-right">
                          <div className="text-orange-400">{strategy.total_return?.toFixed(1)}%</div>
                          <div className="text-sm text-slate-400">{strategy.win_rate?.toFixed(1)}% win rate</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {performanceAnalysis?.consistentPerformers.length > 0 && (
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-green-400">Consistent Performers</CardTitle>
                  <p className="text-slate-400 text-sm">
                    Strategies with both good win rates and positive returns
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {performanceAnalysis.consistentPerformers.slice(0, 5).map((strategy: any) => (
                      <div key={strategy.id} className="flex justify-between items-center p-2 bg-slate-800 rounded">
                        <span className="text-white">{strategy.strategy_name}</span>
                        <div className="text-right">
                          <div className="text-green-400">{strategy.total_return?.toFixed(1)}%</div>
                          <div className="text-sm text-slate-400">{strategy.win_rate?.toFixed(1)}% win rate</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserTestingAnalytics;
