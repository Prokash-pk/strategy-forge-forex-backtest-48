
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Settings, TrendingUp, Wifi } from 'lucide-react';

interface OANDAIntegrationHeaderProps {
  isConnected: boolean;
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
  isConfigured: boolean;
}

const OANDAIntegrationHeader: React.FC<OANDAIntegrationHeaderProps> = ({
  isConnected,
  connectionStatus,
  isConfigured
}) => {
  return (
    <div className="flex items-center justify-between text-white">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6" />
        OANDA Live Trading Integration
      </div>
      <div className="flex items-center gap-2">
        {isConnected && (
          <Badge variant="default" className="bg-emerald-600">
            <Wifi className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        )}
        {connectionStatus === 'success' && !isConnected && (
          <Badge variant="default" className="bg-emerald-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        )}
        {connectionStatus === 'error' && (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )}
        {!isConfigured && (
          <Badge variant="secondary" className="bg-slate-600">
            <Settings className="h-3 w-3 mr-1" />
            Setup Required
          </Badge>
        )}
      </div>
    </div>
  );
};

export default OANDAIntegrationHeader;
