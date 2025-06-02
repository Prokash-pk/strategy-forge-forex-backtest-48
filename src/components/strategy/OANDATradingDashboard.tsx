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

interface OANDATradingDashboardProps {
  isActive: boolean;
  strategy: StrategySettings | null;
  environment: 'practice' | 'live';
}

const OANDATradingDashboard: React.FC<OANDATradingDashboardProps> = ({
  isActive,
  strategy,
  environment
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
    
    // If active, fetch positions
    if (isActive) {
      fetchPositions();
      
      // Set up periodic refresh when forward testing is active
      const interval = setInterval(() => {
        fetchPositions();
        loadTradeLog();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [isActive]);

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
    // Mock implementation - would need actual OANDA credentials from config
    console.log('Fetching positions for environment:', environment);
  };

  const handleClosePosition = async (position: Position) => {
    console.log('Closing position:', position);
  };

  const handleRefresh = () => {
    fetchPositions();
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
              Account Summary - {strategy?.strategy_name || 'No Strategy'}
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
