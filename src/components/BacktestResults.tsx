import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, Shield, BarChart3 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BacktestResultsProps {
  results: any;
}

const BacktestResults: React.FC<BacktestResultsProps> = ({ results }) => {
  if (!results) {
    return (
      <Card className="bg-slate-800 border-slate-700 p-8">
        <div className="text-center text-slate-400">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold mb-2">No Backtest Results</h3>
          <p>Run a backtest from the Strategy Builder to see results here</p>
        </div>
      </Card>
    );
  }

  const performanceMetrics = [
    {
      label: 'Total Return',
      value: `${results.totalReturn.toFixed(2)}%`,
      icon: TrendingUp,
      color: results.totalReturn > 0 ? 'text-emerald-400' : 'text-red-400',
      bgColor: results.totalReturn > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
    },
    {
      label: 'Win Rate',
      value: `${results.winRate.toFixed(1)}%`,
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Max Drawdown',
      value: `${results.maxDrawdown.toFixed(2)}%`,
      icon: TrendingDown,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    },
    {
      label: 'Sharpe Ratio',
      value: results.sharpeRatio.toFixed(2),
      icon: Shield,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    }
  ];

  const monthlyReturns = [
    { month: 'Jan', return: 2.3 },
    { month: 'Feb', return: -1.2 },
    { month: 'Mar', return: 4.1 },
    { month: 'Apr', return: 1.8 },
    { month: 'May', return: -0.9 },
    { month: 'Jun', return: 3.2 },
    { month: 'Jul', return: 2.7 },
    { month: 'Aug', return: -2.1 },
    { month: 'Sep', return: 1.9 },
    { month: 'Oct', return: 4.8 },
    { month: 'Nov', return: 3.1 },
    { month: 'Dec', return: 2.4 }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">{metric.label}</p>
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Strategy Info */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            {results.strategy}
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">
              {results.symbol.replace('=X', '')} • {results.timeframe}
            </Badge>
          </CardTitle>
          <p className="text-slate-400">{results.period}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Initial Balance</p>
              <p className="text-white font-semibold">${results.initialBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400">Final Balance</p>
              <p className="text-white font-semibold">${results.finalBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400">Total Trades</p>
              <p className="text-white font-semibold">{results.totalTrades}</p>
            </div>
            <div>
              <p className="text-slate-400">Profit Factor</p>
              <p className="text-white font-semibold">{results.profitFactor}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Details */}
      <Tabs defaultValue="equity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
          <TabsTrigger value="equity" className="data-[state=active]:bg-emerald-600">Equity Curve</TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-emerald-600">Monthly Returns</TabsTrigger>
          <TabsTrigger value="trades" className="data-[state=active]:bg-emerald-600">Trade Log ({results.trades.length})</TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-emerald-600">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="equity">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Equity Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#9CA3AF' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Monthly Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyReturns}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="return" 
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Complete Trade Log</CardTitle>
              <p className="text-slate-400 text-sm">Showing all {results.trades.length} trades executed</p>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/30">
                      <TableHead className="text-slate-400">Trade #</TableHead>
                      <TableHead className="text-slate-400">Date</TableHead>
                      <TableHead className="text-slate-400">Type</TableHead>
                      <TableHead className="text-slate-400">Entry</TableHead>
                      <TableHead className="text-slate-400">Exit</TableHead>
                      <TableHead className="text-slate-400">P&L</TableHead>
                      <TableHead className="text-slate-400">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.trades.map((trade: any) => (
                      <TableRow key={trade.id} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell className="text-white font-medium">{trade.id}</TableCell>
                        <TableCell className="text-slate-300">{trade.date.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={trade.type === 'BUY' ? 'default' : 'secondary'} className="text-xs">
                            {trade.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">{trade.entry.toFixed(5)}</TableCell>
                        <TableCell className="text-slate-300">{trade.exit.toFixed(5)}</TableCell>
                        <TableCell className={`font-semibold ${trade.pnl > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ${trade.pnl.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-slate-300">{trade.duration}m</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Trade Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Winning Trades</span>
                  <span className="text-emerald-400 font-semibold">{results.winningTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Losing Trades</span>
                  <span className="text-red-400 font-semibold">{results.losingTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Average Win</span>
                  <span className="text-emerald-400 font-semibold">${results.avgWin.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Average Loss</span>
                  <span className="text-red-400 font-semibold">${results.avgLoss.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Profit Factor</span>
                  <span className="text-white font-semibold">{results.profitFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sharpe Ratio</span>
                  <span className="text-white font-semibold">{results.sharpeRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Drawdown</span>
                  <span className="text-orange-400 font-semibold">{results.maxDrawdown.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Win Rate</span>
                  <span className="text-blue-400 font-semibold">{results.winRate.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BacktestResults;
