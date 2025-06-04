
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, AlertCircle, Search } from 'lucide-react';
import AccountSummaryCard from './dashboard/AccountSummaryCard';
import PositionsTable from './dashboard/PositionsTable';
import TradeLogCard from './dashboard/TradeLogCard';
import InactiveStateCard from './dashboard/InactiveStateCard';
import TradingDiagnostics from './dashboard/TradingDiagnostics';
import ComprehensiveDiagnostics from './dashboard/ComprehensiveDiagnostics';
import { ForwardTestingService } from '@/services/forwardTestingService';

interface OANDATradingDashboardProps {
  isActive: boolean;
  strategy: any;
  environment: 'practice' | 'live';
  oandaConfig: {
    accountId: string;
    apiKey: string;
    environment: 'practice' | 'live';
  };
}

const OANDATradingDashboard: React.FC<OANDATradingDashboardProps> = ({
  isActive,
  strategy,
  environment,
  oandaConfig
}) => {
  const [tradingStats, setTradingStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTradingStats = async () => {
      if (isActive) {
        try {
          const service = ForwardTestingService.getInstance();
          const stats = await service.getForwardTestingStats();
          setTradingStats(stats);
        } catch (error) {
          console.error('Failed to load trading stats:', error);
        }
      }
      setIsLoading(false);
    };

    loadTradingStats();
    
    // Refresh stats every 30 seconds if active
    const interval = isActive ? setInterval(loadTradingStats, 30000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  if (!isActive) {
    return <InactiveStateCard />;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5" />
            Live Trading Dashboard
            <Badge variant="default" className="bg-emerald-600">
              <Activity className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-slate-600">
                Overview
              </TabsTrigger>
              <TabsTrigger value="positions" className="data-[state=active]:bg-slate-600">
                Positions
              </TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-slate-600">
                Trade Logs
              </TabsTrigger>
              <TabsTrigger value="diagnostics" className="data-[state=active]:bg-slate-600">
                Diagnostics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AccountSummaryCard 
                  environment={environment}
                  accountId={oandaConfig.accountId}
                  isLoading={isLoading}
                />
                
                {tradingStats && (
                  <Card className="bg-slate-700/50 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Trading Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Trades:</span>
                        <span className="text-white">{tradingStats.totalTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Successful:</span>
                        <span className="text-emerald-400">{tradingStats.successfulTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Failed:</span>
                        <span className="text-red-400">{tradingStats.failedTrades}</span>
                      </div>
                      {tradingStats.lastExecution && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Last Trade:</span>
                          <span className="text-white text-xs">
                            {new Date(tradingStats.lastExecution).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-slate-700/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Strategy Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Name:</span>
                      <span className="text-white text-xs">{strategy?.strategy_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Symbol:</span>
                      <span className="text-white">{strategy?.symbol || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Timeframe:</span>
                      <span className="text-white">{strategy?.timeframe || 'N/A'}</span>
                    </div>
                    {strategy?.total_return && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Backtest Return:</span>
                        <span className="text-emerald-400">{strategy.total_return.toFixed(2)}%</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="positions" className="mt-6">
              <PositionsTable 
                oandaConfig={oandaConfig}
                isActive={isActive}
              />
            </TabsContent>

            <TabsContent value="logs" className="mt-6">
              <TradeLogCard 
                strategy={strategy}
                isActive={isActive}
              />
            </TabsContent>

            <TabsContent value="diagnostics" className="mt-6">
              <div className="space-y-6">
                <ComprehensiveDiagnostics />
                <TradingDiagnostics strategy={strategy} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default OANDATradingDashboard;
