
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardTabs from './dashboard/DashboardTabs';
import InactiveStateCard from './dashboard/InactiveStateCard';
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

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <DashboardHeader />
        <CardContent>
          <DashboardTabs
            strategyName={strategyName}
            accountBalance={accountBalance}
            positionsCount={positionsCount}
            totalPL={totalPL}
            environment={environment}
            accountId={oandaConfig.accountId}
            isLoading={isLoading}
            onRefresh={fetchAccountData}
            tradingStats={tradingStats}
            strategy={strategy}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default OANDATradingDashboard;
