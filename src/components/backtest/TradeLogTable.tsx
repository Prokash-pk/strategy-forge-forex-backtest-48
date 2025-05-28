
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime } from '@/utils/dateUtils';

interface TradeLogTableProps {
  trades: any[];
}

const TradeLogTable: React.FC<TradeLogTableProps> = ({ trades }) => {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Complete Trade Log</CardTitle>
        <p className="text-slate-400 text-sm">Showing all {trades.length} trades executed (SGT timezone)</p>
      </CardHeader>
      <CardContent>
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
              {trades.map((trade: any) => (
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
                  <TableCell className="text-slate-300">{trade.duration}m</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeLogTable;
