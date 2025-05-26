
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, RefreshCw, Calendar, Clock } from 'lucide-react';

const cachedData = [
  { 
    symbol: 'EURUSD=X', 
    timeframe: '1h', 
    period: 'Last 730 days (Auto)', 
    size: '8.7 MB', 
    lastUpdate: new Date().toLocaleDateString(),
    dataPoints: '17,520',
    status: 'live'
  },
  { 
    symbol: 'GBPUSD=X', 
    timeframe: '5m', 
    period: 'Last 60 days (Auto)', 
    size: '12.3 MB', 
    lastUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString(),
    dataPoints: '17,280',
    status: 'recent'
  },
  { 
    symbol: 'USDJPY=X', 
    timeframe: '1d', 
    period: 'Last 5 years (Auto)', 
    size: '2.1 MB', 
    lastUpdate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    dataPoints: '1,825',
    status: 'recent'
  }
];

const AvailableData = () => {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Database className="h-5 w-5" />
          Available Data
        </CardTitle>
        <p className="text-slate-400 text-sm">Recently fetched market data</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cachedData.map((data, index) => (
            <div key={index} className="p-4 bg-slate-700 rounded-lg border border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">
                    {data.symbol.replace('=X', '')}
                  </Badge>
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    {data.timeframe}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={data.status === 'live' ? 'border-emerald-500 text-emerald-400' : 'border-blue-500 text-blue-400'}
                  >
                    {data.status === 'live' ? 'Live' : 'Recent'}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-sm">{data.size}</div>
                  <div className="text-xs text-slate-500">{data.dataPoints} points</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <span>{data.period}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="h-4 w-4" />
                  <span>Updated {data.lastUpdate}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                  Export
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailableData;
