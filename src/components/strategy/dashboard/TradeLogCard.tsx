
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
    <Card className="bg-slate-800 border-slate-700 w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          Autonomous Trade Log
        </CardTitle>
        <p className="text-xs sm:text-sm text-slate-400">
          Recent trades from autonomous forward testing ({timezoneAbbr})
        </p>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        {tradeLog.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No autonomous trades executed yet</p>
            <p className="text-xs text-slate-500 mt-1 px-4">
              Server-side trading will execute trades automatically based on your strategy signals
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-80 sm:max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400 text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Time ({timezoneAbbr})
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-400 text-xs sm:text-sm">Action</TableHead>
                    <TableHead className="text-slate-400 text-xs sm:text-sm">Symbol</TableHead>
                    <TableHead className="text-slate-400 text-xs sm:text-sm hidden sm:table-cell">Units</TableHead>
                    <TableHead className="text-slate-400 text-xs sm:text-sm hidden md:table-cell">Strategy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradeLog.map((trade, index) => (
                    <TableRow key={`${trade.timestamp}-${index}`} className="border-slate-700">
                      <TableCell className="text-slate-300 text-xs sm:text-sm p-2">
                        {formatDateTime(trade.timestamp)}
                      </TableCell>
                      <TableCell className="p-2">
                        <Badge 
                          className={`text-xs ${trade.action === 'BUY' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {trade.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs sm:text-sm p-2">
                        {trade.symbol}
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs sm:text-sm p-2 hidden sm:table-cell">
                        {trade.units.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs sm:text-sm p-2 hidden md:table-cell">
                        <span className="truncate block max-w-[100px]">{trade.strategyName}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradeLogCard;
