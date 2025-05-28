
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime } from '@/utils/dateUtils';

interface Trade {
  id?: number;
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  pnlPips?: number;
  type: string;
  exitReason?: string;
}

interface TradeLogTableProps {
  trades: Trade[];
}

const TradeLogTable: React.FC<TradeLogTableProps> = ({ trades }) => {
  console.log('TradeLogTable received trades:', trades);

  // Process trades to ensure they have the right format
  const processedTrades = (trades || []).map((trade, index) => ({
    id: trade.id || index + 1,
    date: trade.entryTime || trade.exitTime || new Date().toISOString(),
    type: trade.type?.toUpperCase() || 'BUY',
    entry: trade.entryPrice || 0,
    exit: trade.exitPrice || 0,
    pnl: trade.pnl || 0,
    duration: calculateDuration(trade.entryTime, trade.exitTime)
  }));

  function calculateDuration(entryTime: string, exitTime: string): string {
    if (!entryTime || !exitTime) return '0m';
    
    try {
      const entry = new Date(entryTime);
      const exit = new Date(exitTime);
      const diffMs = exit.getTime() - entry.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      return `${diffMins}m`;
    } catch (error) {
      return '0m';
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Complete Trade Log</CardTitle>
        <p className="text-slate-400 text-sm">
          Showing {processedTrades.length} trades executed
          {processedTrades.length === 0 && ' (No trades found - check strategy signals)'}
        </p>
      </CardHeader>
      <CardContent>
        {processedTrades.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <p className="text-lg mb-2">No trades executed</p>
            <p className="text-sm">
              This could mean:
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Strategy conditions were not met during the backtest period</li>
              <li>• Check your entry/exit signals in the strategy code</li>
              <li>• Try adjusting the strategy parameters or timeframe</li>
            </ul>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/30">
                  <TableHead className="text-slate-400">Trade #</TableHead>
                  <TableHead className="text-slate-400">Date (SGT)</TableHead>
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">Entry</TableHead>
                  <TableHead className="text-slate-400">Exit</TableHead>
                  <TableHead className="text-slate-400">P&L</TableHead>
                  <TableHead className="text-slate-400">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedTrades.map((trade) => (
                  <TableRow key={trade.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="text-white font-medium">{trade.id}</TableCell>
                    <TableCell className="text-slate-300">{formatDateTime(trade.date)}</TableCell>
                    <TableCell>
                      <Badge variant={trade.type === 'BUY' ? 'default' : 'secondary'} className="text-xs">
                        {trade.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{trade.entry.toFixed(5)}</TableCell>
                    <TableCell className="text-slate-300">{trade.exit.toFixed(5)}</TableCell>
                    <TableCell className={`font-semibold ${trade.pnl > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${trade.pnl.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-slate-300">{trade.duration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradeLogTable;
