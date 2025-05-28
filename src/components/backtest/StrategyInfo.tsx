
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StrategyInfoProps {
  results: any;
}

const StrategyInfo: React.FC<StrategyInfoProps> = ({ results }) => {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          {results.strategy}
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">
            {results.symbol.replace('=X', '')} • {results.timeframe}
          </Badge>
        </CardTitle>
        <p className="text-slate-400">{results.period}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Initial Balance</p>
            <p className="text-white font-semibold">${results.initialBalance.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-400">Final Balance</p>
            <p className="text-white font-semibold">${results.finalBalance.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-400">Total Trades</p>
            <p className="text-white font-semibold">{results.totalTrades}</p>
          </div>
          <div>
            <p className="text-slate-400">Profit Factor</p>
            <p className="text-white font-semibold">{results.profitFactor}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StrategyInfo;
