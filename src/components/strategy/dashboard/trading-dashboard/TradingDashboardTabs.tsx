
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TradingOverviewTab from './TradingOverviewTab';
import TradingDiagnosticsTab from './TradingDiagnosticsTab';
import EnhancedTradeExecutor from '../EnhancedTradeExecutor';
import LiveTradeMonitor from '../LiveTradeMonitor';
import PositionsTable from '../PositionsTable';
import MarketHoursIndicator from '../MarketHoursIndicator';
import DataConsistencyChecker from '../DataConsistencyChecker';

interface TradingDashboardTabsProps {
  strategy: any;
  oandaConfig: any;
  isConfigured: boolean;
  isActive: boolean;
  onToggleForwardTesting: () => void;
  tradingStats: any;
  accountData: any;
  environment: 'practice' | 'live';
  accountBalance: number;
  positionsCount: number;
  totalPL: number;
  strategyName: string;
  isLoading: boolean;
  onRefreshAccountData: () => void;
}

const TradingDashboardTabs: React.FC<TradingDashboardTabsProps> = ({
  strategy,
  oandaConfig,
  isConfigured,
  isActive,
  onToggleForwardTesting,
  tradingStats,
  accountData,
  environment,
  accountBalance,
  positionsCount,
  totalPL,
  strategyName,
  isLoading,
  onRefreshAccountData
}) => {
  return (
    <Tabs defaultValue="execution" className="w-full">
      <TabsList className="grid w-full grid-cols-6 bg-slate-700">
        <TabsTrigger value="execution" className="data-[state=active]:bg-slate-600">
          Execution
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
        <TabsTrigger value="market" className="data-[state=active]:bg-slate-600">
          Market
        </TabsTrigger>
        <TabsTrigger value="diagnostics" className="data-[state=active]:bg-slate-600">
          Diagnostics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="execution" className="mt-6">
        <div className="space-y-6">
          <EnhancedTradeExecutor
            strategy={strategy}
            oandaConfig={oandaConfig}
            isActive={isActive}
            onToggleTrading={onToggleForwardTesting}
          />
        </div>
      </TabsContent>

      <TabsContent value="monitor" className="mt-6">
        <LiveTradeMonitor 
          isActive={isActive}
          strategy={strategy}
        />
      </TabsContent>

      <TabsContent value="overview" className="mt-6">
        <TradingOverviewTab
          strategyName={strategyName}
          accountBalance={accountBalance}
          positionsCount={positionsCount}
          totalPL={totalPL}
          environment={environment}
          accountId={oandaConfig.accountId}
          isLoading={isLoading}
          onRefresh={onRefreshAccountData}
          tradingStats={tradingStats}
          strategy={strategy}
        />
      </TabsContent>

      <TabsContent value="positions" className="mt-6">
        <PositionsTable 
          positions={[]}
          closingPositions={new Set()}
          onClosePosition={() => {}}
        />
      </TabsContent>

      <TabsContent value="market" className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarketHoursIndicator />
          <DataConsistencyChecker
            strategy={strategy}
            oandaConfig={oandaConfig}
          />
        </div>
      </TabsContent>

      <TabsContent value="diagnostics" className="mt-6">
        <TradingDiagnosticsTab strategy={strategy} />
      </TabsContent>
    </Tabs>
  );
};

export default TradingDashboardTabs;
