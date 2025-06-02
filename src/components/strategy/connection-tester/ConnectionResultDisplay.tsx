
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface AccountInfo {
  balance: number;
  currency: string;
  nav: number;
  unrealizedPL: number;
  marginUsed: number;
  marginAvailable: number;
  positionValue: number;
  openTradeCount: number;
  openPositionCount: number;
  alias: string;
}

interface ConnectionResult {
  success: boolean;
  accountInfo?: AccountInfo;
  error?: string;
  details?: any;
}

interface ConnectionResultDisplayProps {
  result: ConnectionResult;
}

const ConnectionResultDisplay: React.FC<ConnectionResultDisplayProps> = ({ result }) => {
  return (
    <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        {result.success ? (
          <CheckCircle className="h-5 w-5 text-emerald-400" />
        ) : (
          <XCircle className="h-5 w-5 text-red-400" />
        )}
        <span className="font-medium text-white">
          {result.success ? 'Connection Successful' : 'Connection Failed'}
        </span>
      </div>

      {result.success && result.accountInfo && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Account:</span>
            <span className="text-white ml-2">{result.accountInfo.alias}</span>
          </div>
          <div>
            <span className="text-slate-400">Balance:</span>
            <span className="text-emerald-400 ml-2 font-medium">
              {result.accountInfo.balance} {result.accountInfo.currency}
            </span>
          </div>
          <div>
            <span className="text-slate-400">NAV:</span>
            <span className="text-white ml-2">{result.accountInfo.nav} {result.accountInfo.currency}</span>
          </div>
          <div>
            <span className="text-slate-400">Unrealized P&L:</span>
            <span className={`ml-2 ${result.accountInfo.unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.accountInfo.unrealizedPL >= 0 ? '+' : ''}{result.accountInfo.unrealizedPL} {result.accountInfo.currency}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Open Positions:</span>
            <span className="text-white ml-2">{result.accountInfo.openPositionCount}</span>
          </div>
          <div>
            <span className="text-slate-400">Open Trades:</span>
            <span className="text-white ml-2">{result.accountInfo.openTradeCount}</span>
          </div>
        </div>
      )}

      {!result.success && (
        <div className="text-red-400 text-sm">
          Error: {result.error}
        </div>
      )}
    </div>
  );
};

export default ConnectionResultDisplay;
