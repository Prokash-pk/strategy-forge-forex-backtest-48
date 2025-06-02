
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { SavedOANDAConfig } from '@/types/oanda';

interface AccountConfigCardProps {
  config: SavedOANDAConfig;
  onLoad: (config: SavedOANDAConfig) => void;
  onDelete: (configId: string, configName: string) => void;
}

const AccountConfigCard: React.FC<AccountConfigCardProps> = ({
  config,
  onLoad,
  onDelete
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-600 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-white font-medium">{config.configName}</h4>
          <Badge 
            variant={config.environment === 'practice' ? 'secondary' : 'destructive'}
            className="text-xs"
          >
            {config.environment}
          </Badge>
          {config.enabled && (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-xs">
              Active
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
        {config.enabled ? (
          <CheckCircle className="h-4 w-4 text-emerald-400" />
        ) : (
          <XCircle className="h-4 w-4 text-slate-500" />
        )}
        
        <Button
          onClick={() => onLoad(config)}
          size="sm"
          variant="outline"
          className="border-slate-600 text-slate-300 hover:text-white"
        >
          Load
        </Button>
        
        <Button
          onClick={() => onDelete(config.id, config.configName)}
          size="sm"
          variant="outline"
          className="border-red-600 text-red-300 hover:text-red-200"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AccountConfigCard;
