
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTimeInTimezone, detectUserTimezone, getTimezoneAbbreviation } from '@/utils/timezoneUtils';
import { Clock, MapPin } from 'lucide-react';

interface TradeLogTableProps {
  trades: any[];
  strategyName?: string;
}

const TradeLogTable: React.FC<TradeLogTableProps> = ({ trades, strategyName }) => {
  const userTimezone = detectUserTimezone();
  const timezoneAbbr = getTimezoneAbbreviation();
  
  // Sort trades by date (most recent first)
  const sortedTrades = [...trades].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Descending order (newest first)
  });

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Your Test Results - Trade Log
          {strategyName && (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">
              {strategyName}
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm">
          <p className="text-slate-400">
            Showing all {trades.length} trades from your backtest
          </p>
          <div className="flex items-center gap-1 text-slate-500">
            <MapPin className="h-3 w-3" />
            <span className="text-xs">
              Auto-detected timezone: {timezoneAbbr} ({userTimezone})
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/30">
                <TableHead className="text-slate-400">Trade #</TableHead>
                <TableHead className="text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Date/Time ({timezoneAbbr})
                  </div>
                </TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">Entry</TableHead>
                <TableHead className="text-slate-400">Exit</TableHead>
                <TableHead className="text-slate-400">P&L</TableHead>
                <TableHead className="text-slate-400">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                    No trades executed yet. Run a backtest to see your results here.
                  </TableCell>
                </TableRow>
              ) : (
                sortedTrades.map((trade: any) => (
                  <TableRow key={trade.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="text-white font-medium">{trade.id}</TableCell>
                    <TableCell className="text-slate-300">
                      {formatDateTimeInTimezone(trade.date, userTimezone)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={trade.type === 'BUY' ? 'default' : 'secondary'} 
                        className={`text-xs ${
                          trade.type === 'BUY' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {trade.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300 font-mono">{trade.entry.toFixed(5)}</TableCell>
                    <TableCell className="text-slate-300 font-mono">{trade.exit.toFixed(5)}</TableCell>
                    <TableCell className={`font-semibold ${trade.pnl > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-slate-300">{trade.duration}m</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {sortedTrades.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-emerald-400 font-semibold">
                  {sortedTrades.filter(t => t.pnl > 0).length}
                </div>
                <p className="text-slate-400 text-xs">Winning Trades</p>
              </div>
              <div className="text-center">
                <div className="text-red-400 font-semibold">
                  {sortedTrades.filter(t => t.pnl < 0).length}
                </div>
                <p className="text-slate-400 text-xs">Losing Trades</p>
              </div>
              <div className="text-center">
                <div className="text-white font-semibold">
                  {sortedTrades.length > 0 ? ((sortedTrades.filter(t => t.pnl > 0).length / sortedTrades.length) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-slate-400 text-xs">Win Rate</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradeLogTable;
