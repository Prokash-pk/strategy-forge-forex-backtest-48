
import React from 'react';
import { Zap } from 'lucide-react';

export const ActiveTradingAlert: React.FC = () => {
  return (
    <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
      <Zap className="h-4 w-4 text-emerald-400 mt-0.5 animate-pulse" />
      <div>
        <p className="text-emerald-300 text-sm font-medium">
          🚀 LIVE TRADING ACTIVE
        </p>
        <p className="text-emerald-400 text-xs mt-1">
          • Your strategy is executing REAL trades on OANDA<br />
          • Every strategy signal becomes an actual trade<br />
          • Trades execute automatically every 1 minute<br />
          • Check your OANDA account for trade confirmations<br />
          • Money is at risk - monitor your account balance
        </p>
      </div>
    </div>
  );
};
