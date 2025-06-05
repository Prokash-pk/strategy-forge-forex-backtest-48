
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, AlertCircle, Search } from 'lucide-react';
import AccountSummaryCard from './AccountSummaryCard';
import PositionsTable from './PositionsTable';
import TradeLogCard from './TradeLogCard';
import InactiveStateCard from './InactiveStateCard';
import TradingDiagnostics from './TradingDiagnostics';
import ComprehensiveDiagnostics from './ComprehensiveDiagnostics';
import LiveTradeMonitor from './LiveTradeMonitor';
import AutoTradeExecutor from './AutoTradeExecutor';
import AutoStrategyTesterComponent from './AutoStrategyTester';
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
  onToggleForwardTesting: () => void;
}

const OANDATradingDashboard: React.FC<OANDATradingDashboardProps> = ({
  isActive,
  strategy,
  environment,
  oandaConfig,
  onToggleForwardTesting
}) => {
  const [tradingStats, setTradingStats] = useState<any>(null);
  const [accountData, setAccountData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccountData = async () => {
    if (!isActive || !oandaConfig.accountId || !oandaConfig.apiKey) {
      setIsLoading(false);
      return;
    }

    try {
      const baseUrl = oandaConfig.environment === 'practice' 
        ? 'https://api-fxpractice.oanda.com'
        : 'https://api-fxtrade.oanda.com';

      const response = await fetch(`${baseUrl}/v3/accounts/${oandaConfig.accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${oandaConfig.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAccountData(data.account);
      } else {
        console.error('Failed to fetch account data:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching account data:', error);
    }
  };

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
    fetchAccountData();
    
    // Refresh stats every 30 seconds if active
    const interval = isActive ? setInterval(() => {
      loadTradingStats();
      fetchAccountData();
    }, 30000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, oandaConfig]);

  if (!isActive) {
    return <InactiveStateCard />;
  }

  // Calculate safe values with defaults
  const accountBalance = accountData?.balance ? parseFloat(accountData.balance) : 0;
  const positionsCount = accountData?.openPositionCount ? parseInt(accountData.openPositionCount) : 0;
  const totalPL = accountData?.unrealizedPL ? parseFloat(accountData.unrealizedPL) : 0;
  const strategyName = strategy?.strategy_name || 'No Strategy Selected';
  const isConfigured = Boolean(strategy?.strategy_name && oandaConfig?.accountId && oandaConfig?.apiKey);

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
          <Tabs defaultValue="executor" className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-slate-700">
              <TabsTrigger value="executor" className="data-[state=active]:bg-slate-600">
                Auto-Executor
              </TabsTrigger>
              <TabsTrigger value="tester" className="data-[state=active]:bg-slate-600">
                Auto-Tester
              </TabsTrigger>
              <TabsTrigger value="monitor" className="data-[state=active]:bg-slate-600">
                Live Monitor
              </TabsTrigger>
              <TabsTrigger value="overview" className="data-[state=active]:bg-slate-600">
                Overview
              </TabsTrigger>
              <TabsTrigger value="positions" className="data-[state=active]:bg-slate-600">
                Positions
              </TabsTrigger>
              <TabsTrigger value="diagnostics" className="data-[state=active]:bg-slate-600">
                Diagnostics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="executor" className="mt-6">
              <AutoTradeExecutor
                strategy={strategy}
                oandaConfig={oandaConfig}
                isActive={isActive}
                onToggleTrading={onToggleForwardTesting}
              />
            </TabsContent>

            <TabsContent value="tester" className="mt-6">
              <AutoStrategyTesterComponent
                strategy={strategy}
                oandaConfig={oandaConfig}
                isConfigured={isConfigured}
              />
            </TabsContent>

            <TabsContent value="monitor" className="mt-6">
              <LiveTradeMonitor
                isActive={isActive}
                strategy={strategy}
              />
            </TabsContent>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AccountSummaryCard 
                  strategyName={strategyName}
                  accountBalance={accountBalance}
                  positionsCount={positionsCount}
                  totalPL={totalPL}
                  environment={environment}
                  accountId={oandaConfig.accountId}
                  isLoading={isLoading}
                  onRefresh={fetchAccountData}
                />
                
                {tradingStats && (
                  <Card className="bg-slate-700/50 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Trading Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Trades:</span>
                        <span className="text-white">{tradingStats.totalTrades || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Successful:</span>
                        <span className="text-emerald-400">{tradingStats.successfulTrades || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Failed:</span>
                        <span className="text-red-400">{tradingStats.failedTrades || 0}</span>
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
                positions={[]}
                closingPositions={new Set()}
                onClosePosition={() => {}}
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
