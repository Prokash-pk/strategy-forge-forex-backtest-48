
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, X, Loader2 } from 'lucide-react';

interface Position {
  id: string;
  instrument: string;
  units: number;
  price: number;
  unrealizedPL: number;
  side: 'BUY' | 'SELL';
  timestamp: string;
}

interface PositionsTableProps {
  positions: Position[];
  closingPositions: Set<string>;
  onClosePosition: (position: Position) => void;
}

const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  closingPositions,
  onClosePosition
}) => {
  if (positions.length === 0) {
    return null;
  }

  return (
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
              {positions.map((position) => {
                const isClosing = closingPositions.has(position.id);
                
                return (
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
                        onClick={() => onClosePosition(position)}
                        disabled={isClosing}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-300 hover:text-red-200 disabled:opacity-50"
                      >
                        {isClosing ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Closing...
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Close
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PositionsTable;
