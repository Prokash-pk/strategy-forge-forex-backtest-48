
import { useState, useEffect } from 'react';
import { ForwardTestingService } from '@/services/forwardTestingService';

interface UseTradingDashboardProps {
  isActive: boolean;
  oandaConfig: {
    accountId: string;
    apiKey: string;
    environment: 'practice' | 'live';
  };
}

export const useTradingDashboard = ({ isActive, oandaConfig }: UseTradingDashboardProps) => {
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

  const loadTradingStats = async () => {
    if (isActive) {
      try {
        const stats = await ForwardTestingService.getForwardTestingStats();
        setTradingStats(stats);
      } catch (error) {
        console.error('Failed to load trading stats:', error);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
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

  return {
    tradingStats,
    accountData,
    isLoading,
    fetchAccountData
  };
};
