
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Globe, TrendingUp } from 'lucide-react';
import { getMarketStatus, formatMarketStatus, type MarketStatus } from '@/utils/marketHours';

const MarketHoursIndicator: React.FC = () => {
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      try {
        const status = getMarketStatus();
        setMarketStatus(status);
      } catch (error) {
        console.error('Error getting market status:', error);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!marketStatus) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-slate-400">Loading market status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (!marketStatus.isOpen) return 'bg-red-600';
    switch (marketStatus.volume) {
      case 'high': return 'bg-emerald-600';
      case 'medium': return 'bg-amber-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-slate-600';
    }
  };

  const getVolumeIcon = () => {
    switch (marketStatus.volume) {
      case 'high': return <TrendingUp className="h-3 w-3" />;
      case 'medium': return <Globe className="h-3 w-3" />;
      case 'low': return <Clock className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Market Hours
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Status:</span>
          <Badge variant="default" className={getStatusColor()}>
            {marketStatus.isOpen ? 'Open' : 'Closed'}
          </Badge>
        </div>

        {marketStatus.isOpen && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Volume:</span>
              <Badge variant="outline" className="text-white border-slate-600">
                {getVolumeIcon()}
                <span className="ml-1 capitalize">{marketStatus.volume}</span>
              </Badge>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400">Active Sessions:</span>
              <div className="flex flex-wrap gap-1">
                {marketStatus.activeSessions.map((session) => (
                  <Badge key={session} variant="outline" className="text-xs text-slate-300 border-slate-600">
                    {session}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
          {marketStatus.nextOpen && !marketStatus.isOpen && (
            <div>Next Open: {marketStatus.nextOpen.toLocaleString()}</div>
          )}
          {marketStatus.nextClose && marketStatus.isOpen && (
            <div>Next Close: {marketStatus.nextClose.toLocaleString()}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketHoursIndicator;
