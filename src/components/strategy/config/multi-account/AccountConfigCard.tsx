
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Wifi, TestTube } from 'lucide-react';
import { SavedOANDAConfig } from '@/types/oanda';

interface AccountConfigCardProps {
  config: SavedOANDAConfig;
  onLoad: (config: SavedOANDAConfig) => void;
  onDelete: (configId: string) => Promise<void>;
  onTestTrade?: () => void;
}

const AccountConfigCard: React.FC<AccountConfigCardProps> = ({
  config,
  onLoad,
  onDelete,
  onTestTrade
}) => {
  const handleDelete = async () => {
    await onDelete(config.id);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-white font-medium">{config.configName}</h4>
          <Badge 
            variant={config.environment === 'practice' ? 'secondary' : 'destructive'}
            className="text-xs"
          >
            {config.environment}
          </Badge>
          {config.enabled && (
            <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected 24/7
            </Badge>
          )}
        </div>
        <p className="text-slate-400 text-sm">
          Account: {config.accountId}
        </p>
        <p className="text-slate-400 text-xs">
          Added: {new Date(config.createdAt).toLocaleDateString()}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        {onTestTrade && (
          <Button
            onClick={onTestTrade}
            size="sm"
            variant="outline"
            className="border-blue-600 text-blue-300 hover:text-blue-200"
          >
            <TestTube className="h-4 w-4 mr-1" />
            Test Trade
          </Button>
        )}
        
        <Button
          onClick={handleDelete}
          size="sm"
          variant="outline"
          className="border-red-600 text-red-300 hover:text-red-200"
        >
          <Wifi className="h-4 w-4 mr-1" />
          Disconnect
        </Button>
      </div>
    </div>
  );
};

export default AccountConfigCard;
