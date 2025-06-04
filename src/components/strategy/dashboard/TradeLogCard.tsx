
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, ChevronLeft, ChevronRight, Info } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 10;
  
  // Calculate pagination
  const totalPages = Math.ceil(tradeLog.length / tradesPerPage);
  const startIndex = (currentPage - 1) * tradesPerPage;
  const endIndex = startIndex + tradesPerPage;
  const currentTrades = tradeLog.slice(startIndex, endIndex);
  
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <Card className="bg-slate-800 border-slate-700 w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          Live Forward Trading Log
        </CardTitle>
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-slate-400">
            Real trades executed through OANDA API ({timezoneAbbr})
          </p>
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-300">
              <p className="font-medium">Note: This shows only LIVE trades executed through your OANDA account.</p>
              <p>Backtest results (like Smart Momentum Strategy historical data) are simulated trades and appear only in the Strategy Builder section.</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        {tradeLog.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No live trades executed yet</p>
            <p className="text-xs text-slate-500 mt-1 px-4">
              Server-side trading will execute trades automatically when your strategy generates signals on live market data
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
                      <TableHead className="text-slate-400 text-xs sm:text-sm hidden lg:table-cell">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTrades.map((trade, index) => (
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
                        <TableCell className="p-2 hidden lg:table-cell">
                          <Badge 
                            variant={trade.status === 'executed' ? 'default' : trade.status === 'pending' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {trade.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-700 pt-4">
                <div className="text-xs text-slate-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, tradeLog.length)} of {tradeLog.length} trades
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="border-slate-600 text-slate-300 hover:text-white disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="border-slate-600 text-slate-300 hover:text-white disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradeLogCard;
