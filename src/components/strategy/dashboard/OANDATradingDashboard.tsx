
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import InactiveStateCard from './InactiveStateCard';
import TradingDashboardHeader from './trading-dashboard/TradingDashboardHeader';
import TradingDashboardTabs from './trading-dashboard/TradingDashboardTabs';
import { useTradingDashboard } from './trading-dashboard/useTradingDashboard';

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
  const {
    tradingStats,
    accountData,
    isLoading,
    fetchAccountData
  } = useTradingDashboard({ isActive, oandaConfig });

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
        <TradingDashboardHeader />
        <CardContent>
          <TradingDashboardTabs
            strategy={strategy}
            oandaConfig={oandaConfig}
            isConfigured={isConfigured}
            isActive={isActive}
            onToggleForwardTesting={onToggleForwardTesting}
            tradingStats={tradingStats}
            accountData={accountData}
            environment={environment}
            accountBalance={accountBalance}
            positionsCount={positionsCount}
            totalPL={totalPL}
            strategyName={strategyName}
            isLoading={isLoading}
            onRefreshAccountData={fetchAccountData}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default OANDATradingDashboard;
