
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AccountSummaryCard from './AccountSummaryCard';
import TradingStatsCard from './TradingStatsCard';
import StrategyInfoCard from './StrategyInfoCard';
import PositionsTable from './PositionsTable';
import TradeLogCard from './TradeLogCard';
import TradingDiagnostics from './TradingDiagnostics';

interface DashboardTabsProps {
  strategyName: string;
  accountBalance: number;
  positionsCount: number;
  totalPL: number;
  environment: 'practice' | 'live';
  accountId: string;
  isLoading: boolean;
  onRefresh: () => void;
  tradingStats: any;
  strategy: any;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({
  strategyName,
  accountBalance,
  positionsCount,
  totalPL,
  environment,
  accountId,
  isLoading,
  onRefresh,
  tradingStats,
  strategy
}) => {
  return (
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
            strategyName={strategyName}
            accountBalance={accountBalance}
            positionsCount={positionsCount}
            totalPL={totalPL}
            environment={environment}
            accountId={accountId}
            isLoading={isLoading}
            onRefresh={onRefresh}
          />
          
          <TradingStatsCard tradingStats={tradingStats} />
          <StrategyInfoCard strategy={strategy} />
        </div>
      </TabsContent>

      <TabsContent value="positions" className="mt-6">
        <PositionsTable 
          positions={[]}
          closingPositions={new Set()}
          onClosePosition={() => {}}
        />
      </TabsContent>

      <TabsContent value="logs" className="mt-6">
        <TradeLogCard 
          tradeLog={[]}
          timezoneAbbr="UTC"
          formatDateTime={(timestamp: string) => new Date(timestamp).toLocaleString()}
        />
      </TabsContent>

      <TabsContent value="diagnostics" className="mt-6">
        <TradingDiagnostics strategy={strategy} />
      </TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;
