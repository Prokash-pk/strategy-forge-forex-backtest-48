
import React from 'react';
import { CircleCheck } from 'lucide-react';

interface OANDAConnectionStatusProps {
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
  environment: 'practice' | 'live';
  accountId: string;
}

const OANDAConnectionStatus: React.FC<OANDAConnectionStatusProps> = ({
  connectionStatus,
  environment,
  accountId
}) => {
  if (connectionStatus !== 'success') {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
      <CircleCheck className="h-4 w-4 text-emerald-400" />
      <span className="text-emerald-300 text-sm">
        Connected to OANDA {environment} account: {accountId}
      </span>
    </div>
  );
};

export default OANDAConnectionStatus;
