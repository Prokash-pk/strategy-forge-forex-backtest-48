
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

interface OANDATradingDashboardProps {
  config: {
    accountId: string;
    apiKey: string;
    environment: 'practice' | 'live';
  };
  connectionStatus: string;
  isForwardTestingActive: boolean;
}

const OANDATradingDashboard: React.FC<OANDATradingDashboardProps> = ({
  config,
  connectionStatus,
  isForwardTestingActive
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
    
    // If connected and forward testing is active, fetch positions
    if (connectionStatus === 'success' && config.accountId) {
      fetchPositions();
      
      // Set up periodic refresh when forward testing is active
      if (isForwardTestingActive) {
        const interval = setInterval(() => {
          fetchPositions();
          loadTradeLog();
        }, 30000); // Refresh every 30 seconds
        
        return () => clearInterval(interval);
      }
    }
  }, [connectionStatus, config.accountId, isForwardTestingActive]);

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

  const fetchPositions = async () => {
    if (!config.accountId || !config.apiKey || connectionStatus !== 'success') {
      return;
    }

    setIsLoading(true);
    try {
      const baseUrl = config.environment === 'practice' 
        ? 'https://api-fxpractice.oanda.com'
        : 'https://api-fxtrade.oanda.com';

      // Fetch account info
      const accountResponse = await fetch(`${baseUrl}/v3/accounts/${config.accountId}`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        setAccountBalance(parseFloat(accountData.account?.balance || '0'));
        setTotalPL(parseFloat(accountData.account?.unrealizedPL || '0'));
      }

      // Fetch positions
      const positionsResponse = await fetch(`${baseUrl}/v3/accounts/${config.accountId}/positions`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (positionsResponse.ok) {
        const positionsData = await positionsResponse.json();
        const openPositions: Position[] = [];

        positionsData.positions?.forEach((pos: any) => {
          // Check for long positions
          if (pos.long && parseFloat(pos.long.units) !== 0) {
            openPositions.push({
              id: `${pos.instrument}_long`,
              instrument: pos.instrument,
              units: parseFloat(pos.long.units),
              price: parseFloat(pos.long.averagePrice || '0'),
              unrealizedPL: parseFloat(pos.long.unrealizedPL || '0'),
              side: 'BUY',
              timestamp: new Date().toISOString()
            });
          }
          
          // Check for short positions
          if (pos.short && parseFloat(pos.short.units) !== 0) {
            openPositions.push({
              id: `${pos.instrument}_short`,
              instrument: pos.instrument,
              units: Math.abs(parseFloat(pos.short.units)),
              price: parseFloat(pos.short.averagePrice || '0'),
              unrealizedPL: parseFloat(pos.short.unrealizedPL || '0'),
              side: 'SELL',
              timestamp: new Date().toISOString()
            });
          }
        });

        setPositions(openPositions);
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
      toast({
        title: "Failed to Fetch Data",
        description: "Could not retrieve account information from OANDA",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePosition = async (position: Position) => {
    if (!config.accountId || !config.apiKey) return;

    try {
      const baseUrl = config.environment === 'practice' 
        ? 'https://api-fxpractice.oanda.com'
        : 'https://api-fxtrade.oanda.com';

      const closeData = position.side === 'BUY' 
        ? { longUnits: 'ALL' }
        : { shortUnits: 'ALL' };

      const response = await fetch(
        `${baseUrl}/v3/accounts/${config.accountId}/positions/${position.instrument}/close`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(closeData)
        }
      );

      if (response.ok) {
        toast({
          title: "Position Closed",
          description: `Successfully closed ${position.side} position for ${position.instrument}`,
        });
        fetchPositions(); // Refresh positions
      } else {
        throw new Error('Failed to close position');
      }
    } catch (error) {
      console.error('Close position error:', error);
      toast({
        title: "Close Position Failed",
        description: "Could not close the position. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    fetchPositions();
    loadTradeLog();
  };

  if (connectionStatus !== 'success') {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Connect to OANDA</h3>
          <p className="text-slate-400">
            Please connect to your OANDA account to view positions and trade logs.
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
              Account Summary
            </CardTitle>
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:text-white self-start sm:self-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
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
              <p className="text-xs text-slate-400">Account Balance</p>
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
        </CardContent>
      </Card>

      {/* Open Positions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No open positions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">Instrument</TableHead>
                    <TableHead className="text-slate-400">Side</TableHead>
                    <TableHead className="text-slate-400 hidden sm:table-cell">Units</TableHead>
                    <TableHead className="text-slate-400 hidden sm:table-cell">Price</TableHead>
                    <TableHead className="text-slate-400">P&L</TableHead>
                    <TableHead className="text-slate-400">Action</TableHead>
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
                          {position.side === 'BUY' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {position.side}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 hidden sm:table-cell">
                        {position.units.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-slate-300 hidden sm:table-cell">
                        {position.price.toFixed(5)}
                      </TableCell>
                      <TableCell className={`font-semibold ${position.unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {position.unrealizedPL >= 0 ? '+' : ''}${position.unrealizedPL.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleClosePosition(position)}
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
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
          )}
        </CardContent>
      </Card>

      {/* Trade Log */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="h-5 w-5" />
            Trade Log
          </CardTitle>
          <p className="text-sm text-slate-400">
            Recent trades from forward testing ({timezoneAbbr})
          </p>
        </CardHeader>
        <CardContent>
          {tradeLog.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No trades executed yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Start forward testing to see trade executions here
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
