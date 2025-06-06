
import React from 'react';
import { CircleCheck, Wifi, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OANDAConnectionStatusProps {
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
  environment: 'practice' | 'live';
  accountId: string;
  isConnected?: boolean;
  lastConnectedAt?: string | null;
  accountInfo?: any | null;
  retryCount?: number;
  isAutoReconnecting?: boolean;
}

const OANDAConnectionStatus: React.FC<OANDAConnectionStatusProps> = ({
  connectionStatus,
  environment,
  accountId,
  isConnected = false,
  lastConnectedAt,
  accountInfo,
  retryCount = 0,
  isAutoReconnecting = false
}) => {
  if (connectionStatus === 'testing' || isAutoReconnecting) {
    return (
      <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <Clock className="h-4 w-4 text-blue-400 animate-spin" />
        <span className="text-blue-300 text-sm">
          {isAutoReconnecting 
            ? `Auto-reconnecting to OANDA... ${retryCount > 0 ? `(Attempt ${retryCount}/3)` : ''}`
            : `Testing connection to OANDA ${environment} environment...`
          }
        </span>
      </div>
    );
  }

  if (connectionStatus === 'error' && !isConnected) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <span className="text-red-300 text-sm">
          {retryCount >= 3 
            ? "Auto-reconnect failed. Please reconnect manually." 
            : "Connection failed"
          }
        </span>
        {retryCount > 0 && retryCount < 3 && (
          <Badge variant="outline" className="border-red-500/30 text-red-300">
            <RotateCcw className="h-3 w-3 mr-1" />
            Retrying...
          </Badge>
        )}
      </div>
    );
  }

  if (connectionStatus !== 'success' && !isConnected) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
        <CircleCheck className="h-4 w-4 text-emerald-400" />
        <div className="flex-1">
          <span className="text-emerald-300 text-sm">
            Connected to OANDA {environment} account: {accountInfo?.alias || accountId}
          </span>
        </div>
        <Badge variant="default" className="bg-emerald-600">
          <Wifi className="h-3 w-3 mr-1" />
          Live
        </Badge>
      </div>
      
      {accountInfo && (
        <div className="text-xs text-slate-400 px-3">
          Balance: {parseFloat(accountInfo.balance || 0).toLocaleString()} {accountInfo.currency || 'USD'} • 
          Positions: {accountInfo.openPositionCount || 0} • 
          Last connected: {lastConnectedAt ? new Date(lastConnectedAt).toLocaleTimeString() : 'Unknown'}
        </div>
      )}
    </div>
  );
};

export default OANDAConnectionStatus;
