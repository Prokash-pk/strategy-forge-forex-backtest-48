
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  Clock, 
  X,
  RefreshCw,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDateTimeInTimezone, detectUserTimezone, getTimezoneAbbreviation } from '@/utils/timezoneUtils';

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
        setTradeLog(trades.reverse()); // Show most recent first
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
    console.log('Closing position:', position);
    // Implementation for closing positions would go here
  };

  const handleRefresh = () => {
    fetchOANDAAccountData();
    loadTradeLog();
  };

  if (!isActive) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Forward Testing Inactive</h3>
          <p className="text-slate-400">
            Please start forward testing to view positions and trade logs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Account Summary */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5" />
              Live OANDA Account - {strategy?.strategy_name || 'No Strategy'}
            </CardTitle>
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:text-white self-start sm:self-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Live Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-slate-700/50 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-lg font-semibold text-white">
                ${accountBalance.toFixed(2)}
              </div>
              <p className="text-xs text-slate-400">Live Account Balance</p>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-lg">
              <Activity className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <div className="text-lg font-semibold text-white">
                {positions.length}
              </div>
              <p className="text-xs text-slate-400">Open Positions</p>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-lg">
              <TrendingUp className={`h-5 w-5 mx-auto mb-1 ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
              <div className={`text-lg font-semibold ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
              </div>
              <p className="text-xs text-slate-400">Unrealized P&L</p>
            </div>
          </div>

          {/* Status indicator */}
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-300 text-sm font-medium">
                Live connection to OANDA {environment} account: {oandaConfig.accountId}
              </span>
            </div>
            <p className="text-emerald-400 text-xs mt-1">
              Data refreshes every 30 seconds • Autonomous trading active
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Open Positions */}
      {positions.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5" />
              Open Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">Instrument</TableHead>
                    <TableHead className="text-slate-400">Side</TableHead>
                    <TableHead className="text-slate-400">Units</TableHead>
                    <TableHead className="text-slate-400">Avg Price</TableHead>
                    <TableHead className="text-slate-400">Unrealized P&L</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => (
                    <TableRow key={position.id} className="border-slate-700">
                      <TableCell className="text-white font-medium">
                        {position.instrument}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={position.side === 'BUY' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-red-500/10 text-red-400'
                          }
                        >
                          {position.side}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {Math.abs(position.units).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {position.price.toFixed(5)}
                      </TableCell>
                      <TableCell className={position.unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {position.unrealizedPL >= 0 ? '+' : ''}${position.unrealizedPL.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleClosePosition(position)}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-300 hover:text-red-200"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Close
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trade Log */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="h-5 w-5" />
            Autonomous Trade Log
          </CardTitle>
          <p className="text-sm text-slate-400">
            Recent trades from autonomous forward testing ({timezoneAbbr})
          </p>
        </CardHeader>
        <CardContent>
          {tradeLog.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No autonomous trades executed yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Server-side trading will execute trades automatically based on your strategy signals
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Time ({timezoneAbbr})
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-400">Action</TableHead>
                    <TableHead className="text-slate-400 hidden sm:table-cell">Symbol</TableHead>
                    <TableHead className="text-slate-400 hidden sm:table-cell">Units</TableHead>
                    <TableHead className="text-slate-400">Strategy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradeLog.map((trade, index) => (
                    <TableRow key={`${trade.timestamp}-${index}`} className="border-slate-700">
                      <TableCell className="text-slate-300 text-sm">
                        {formatDateTimeInTimezone(trade.timestamp, userTimezone)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={trade.action === 'BUY' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-red-500/10 text-red-400'
                          }
                        >
                          {trade.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 hidden sm:table-cell">
                        {trade.symbol}
                      </TableCell>
                      <TableCell className="text-slate-300 hidden sm:table-cell">
                        {trade.units.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {trade.strategyName}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OANDATradingDashboard;
