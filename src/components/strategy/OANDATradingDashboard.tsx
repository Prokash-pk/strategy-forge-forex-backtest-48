import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDateTimeInTimezone, detectUserTimezone, getTimezoneAbbreviation } from '@/utils/timezoneUtils';
import AccountSummaryCard from './dashboard/AccountSummaryCard';
import PositionsTable from './dashboard/PositionsTable';
import TradeLogCard from './dashboard/TradeLogCard';
import InactiveStateCard from './dashboard/InactiveStateCard';
import TradingDiagnostics from './dashboard/TradingDiagnostics';

interface Position {
  id: string;
  instrument: string;
  units: number;
  price: number;
  unrealizedPL: number;
  side: 'BUY' | 'SELL';
  timestamp: string;
}

interface Trade {
  id: string;
  timestamp: string;
  action: string;
  symbol: string;
  units: number;
  price?: number;
  pl?: number;
  status: 'executed' | 'pending' | 'failed';
  strategyName: string;
}

interface StrategySettings {
  id: string;
  strategy_name: string;
  symbol: string;
  timeframe: string;
}

interface OANDAConfig {
  accountId: string;
  apiKey: string;
  environment: 'practice' | 'live';
}

interface OANDATradingDashboardProps {
  isActive: boolean;
  strategy: StrategySettings | null;
  environment: 'practice' | 'live';
  oandaConfig: OANDAConfig;
}

const OANDATradingDashboard: React.FC<OANDATradingDashboardProps> = ({
  isActive,
  strategy,
  environment,
  oandaConfig
}) => {
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [tradeLog, setTradeLog] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [accountBalance, setAccountBalance] = useState<number>(0);
  const [totalPL, setTotalPL] = useState<number>(0);
  const [closingPositions, setClosingPositions] = useState<Set<string>>(new Set());

  const userTimezone = detectUserTimezone();
  const timezoneAbbr = getTimezoneAbbreviation();

  useEffect(() => {
    // Load trade log from localStorage
    loadTradeLog();
    
    // If active and configured, fetch real OANDA data
    if (isActive && oandaConfig.accountId && oandaConfig.apiKey) {
      fetchOANDAAccountData();
      
      // Set up periodic refresh when forward testing is active
      const interval = setInterval(() => {
        fetchOANDAAccountData();
        loadTradeLog();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [isActive, oandaConfig.accountId, oandaConfig.apiKey]);

  const loadTradeLog = () => {
    try {
      const stored = localStorage.getItem('forward_testing_trades');
      if (stored) {
        const trades = JSON.parse(stored);
        console.log('📊 Loaded trade log from localStorage:', trades);
        setTradeLog(trades.reverse()); // Show most recent first
      } else {
        console.log('📊 No trade log found in localStorage');
      }
    } catch (error) {
      console.error('Failed to load trade log:', error);
    }
  };

  const fetchOANDAAccountData = async () => {
    if (!oandaConfig.accountId || !oandaConfig.apiKey) return;
    
    setIsLoading(true);
    
    try {
      const baseUrl = environment === 'practice' 
        ? 'https://api-fxpractice.oanda.com'
        : 'https://api-fxtrade.oanda.com';

      console.log('🔄 Fetching live OANDA account data...');

      // Fetch account details
      const accountResponse = await fetch(`${baseUrl}/v3/accounts/${oandaConfig.accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${oandaConfig.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        const balance = parseFloat(accountData.account.balance);
        const nav = parseFloat(accountData.account.NAV);
        const unrealizedPL = parseFloat(accountData.account.unrealizedPL);
        
        console.log('✅ OANDA Account Data:', {
          balance,
          nav,
          unrealizedPL,
          currency: accountData.account.currency
        });

        setAccountBalance(balance);
        setTotalPL(unrealizedPL);

        // Fetch open positions
        const openPositions = accountData.account.positions || [];
        const formattedPositions: Position[] = openPositions
          .filter((pos: any) => parseFloat(pos.long.units) !== 0 || parseFloat(pos.short.units) !== 0)
          .map((pos: any) => ({
            id: pos.instrument,
            instrument: pos.instrument,
            units: parseFloat(pos.long.units) || parseFloat(pos.short.units),
            price: parseFloat(pos.long.averagePrice) || parseFloat(pos.short.averagePrice) || 0,
            unrealizedPL: parseFloat(pos.long.unrealizedPL) + parseFloat(pos.short.unrealizedPL),
            side: parseFloat(pos.long.units) !== 0 ? 'BUY' : 'SELL',
            timestamp: new Date().toISOString()
          }));

        setPositions(formattedPositions);

        console.log('📊 Open Positions:', formattedPositions);

      } else {
        const errorData = await accountResponse.json();
        console.error('❌ Failed to fetch OANDA account data:', errorData);
        
        toast({
          title: "Failed to fetch account data",
          description: `Error: ${errorData.errorMessage || 'Unknown error'}`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('❌ Error fetching OANDA data:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to OANDA API. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePosition = async (position: Position) => {
    console.log('🔄 Closing position:', position);
    
    // Add position to closing state
    setClosingPositions(prev => new Set(prev).add(position.id));
    
    try {
      const closeSignal = {
        action: 'CLOSE' as const,
        symbol: position.instrument,
        units: 0, // Not used for CLOSE action
        strategyId: strategy?.id || 'manual-close',
        userId: 'user'
      };

      const oandaConfigForClose = {
        accountId: oandaConfig.accountId,
        apiKey: oandaConfig.apiKey,
        environment: oandaConfig.environment
      };

      console.log('🔄 Sending close signal for', position.instrument);
      
      const response = await supabase.functions.invoke('oanda-trade-executor', {
        body: {
          signal: closeSignal,
          config: oandaConfigForClose,
          testMode: false
        }
      });

      console.log('📋 Close position response:', response);

      if (response.error) {
        console.error('❌ Supabase function error:', response.error);
        throw new Error(response.error.message || 'Position close failed');
      }

      if (response.data?.success) {
        const result = response.data.result;
        
        toast({
          title: "✅ Position Closed Successfully!",
          description: `Closed ${position.instrument} position. Check your OANDA platform for confirmation.`,
        });
        
        console.log('✅ Position closed successfully:', result);
        
        // Refresh account data to update positions
        setTimeout(() => {
          fetchOANDAAccountData();
        }, 2000); // Give OANDA a moment to process
        
      } else {
        console.error('❌ Position close failed:', response.data);
        throw new Error(response.data?.error || 'Position close failed');
      }

    } catch (error) {
      console.error('❌ Close position error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "❌ Failed to Close Position",
        description: `Error: ${errorMessage}. Please check your OANDA connection and try again.`,
        variant: "destructive",
      });
    } finally {
      // Remove position from closing state
      setClosingPositions(prev => {
        const newSet = new Set(prev);
        newSet.delete(position.id);
        return newSet;
      });
    }
  };

  const handleRefresh = () => {
    fetchOANDAAccountData();
    loadTradeLog();
  };

  if (!isActive) {
    return (
      <div className="space-y-4 md:space-y-6">
        <InactiveStateCard />
        <TradingDiagnostics strategy={strategy} />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <AccountSummaryCard
        strategyName={strategy?.strategy_name || 'No Strategy'}
        accountBalance={accountBalance}
        positionsCount={positions.length}
        totalPL={totalPL}
        environment={environment}
        accountId={oandaConfig.accountId}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      <PositionsTable
        positions={positions}
        closingPositions={closingPositions}
        onClosePosition={handleClosePosition}
      />

      <TradeLogCard
        tradeLog={tradeLog}
        timezoneAbbr={timezoneAbbr}
        formatDateTime={(timestamp) => formatDateTimeInTimezone(timestamp, userTimezone)}
      />

      <TradingDiagnostics strategy={strategy} />
    </div>
  );
};

export default OANDATradingDashboard;
