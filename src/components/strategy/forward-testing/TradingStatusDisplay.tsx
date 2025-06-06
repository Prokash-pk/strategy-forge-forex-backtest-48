
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

interface StrategySettings {
  id: string;
  strategy_name: string;
  symbol: string;
  timeframe: string;
}

interface TradingStatusDisplayProps {
  selectedStrategy: StrategySettings | null;
  isForwardTestingActive: boolean;
  isButtonDisabled: boolean;
}

export const TradingStatusDisplay: React.FC<TradingStatusDisplayProps> = ({
  selectedStrategy,
  isForwardTestingActive,
  isButtonDisabled
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-white font-medium">
          Strategy: {selectedStrategy ? selectedStrategy.strategy_name : "No strategy selected"}
        </h3>
        <p className="text-slate-400 text-sm">
          {selectedStrategy ? `${selectedStrategy.symbol} • ${selectedStrategy.timeframe}` : "Please select a strategy above"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge 
          variant={isForwardTestingActive ? "default" : "secondary"}
          className={isForwardTestingActive ? "bg-emerald-600 animate-pulse" : "bg-slate-600"}
        >
          {isForwardTestingActive ? (
            <>
              <Zap className="h-3 w-3 mr-1" />
              LIVE TRADES
            </>
          ) : (
            "Inactive"
          )}
        </Badge>
      </div>
    </div>
  );
};
