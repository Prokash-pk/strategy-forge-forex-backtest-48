
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock } from 'lucide-react';

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

interface TradeLogCardProps {
  tradeLog: Trade[];
  timezoneAbbr: string;
  formatDateTime: (timestamp: string) => string;
}

const TradeLogCard: React.FC<TradeLogCardProps> = ({
  tradeLog,
  timezoneAbbr,
  formatDateTime
}) => {
  return (
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
                      {formatDateTime(trade.timestamp)}
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
  );
};

export default TradeLogCard;
