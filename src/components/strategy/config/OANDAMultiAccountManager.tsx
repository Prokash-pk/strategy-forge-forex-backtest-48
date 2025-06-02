
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, CheckCircle, XCircle, Settings } from 'lucide-react';
import { SavedOANDAConfig, OANDAConfig } from '@/types/oanda';
import { useToast } from '@/hooks/use-toast';

interface OANDAMultiAccountManagerProps {
  savedConfigs: SavedOANDAConfig[];
  currentConfig: OANDAConfig;
  onLoadConfig: (config: SavedOANDAConfig) => void;
  onDeleteConfig: (configId: string) => void;
  onSaveNewConfig: (config: OANDAConfig & { configName: string }) => void;
}

const OANDAMultiAccountManager: React.FC<OANDAMultiAccountManagerProps> = ({
  savedConfigs,
  currentConfig,
  onLoadConfig,
  onDeleteConfig,
  onSaveNewConfig
}) => {
  const { toast } = useToast();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');

  const handleSaveCurrentConfig = () => {
    if (!newConfigName.trim()) {
      toast({
        title: "Configuration Name Required",
        description: "Please enter a name for your configuration",
        variant: "destructive",
      });
      return;
    }

    if (!currentConfig.accountId || !currentConfig.apiKey) {
      toast({
        title: "Configuration Incomplete",
        description: "Please fill in all account details before saving",
        variant: "destructive",
      });
      return;
    }

    onSaveNewConfig({
      ...currentConfig,
      configName: newConfigName.trim()
    });

    setNewConfigName('');
    setIsAddingNew(false);

    toast({
      title: "Configuration Saved",
      description: `"${newConfigName}" has been saved successfully`,
    });
  };

  const handleDeleteConfig = (configId: string, configName: string) => {
    onDeleteConfig(configId);
    toast({
      title: "Configuration Deleted",
      description: `"${configName}" has been removed`,
    });
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            OANDA Accounts Manager
          </div>
          <Button
            onClick={() => setIsAddingNew(!isAddingNew)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Account
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Configuration Form */}
        {isAddingNew && (
          <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg space-y-3">
            <Label htmlFor="configName" className="text-slate-300">Configuration Name</Label>
            <Input
              id="configName"
              placeholder="e.g., Demo Account 1, Practice Trading, etc."
              value={newConfigName}
              onChange={(e) => setNewConfigName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSaveCurrentConfig}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Save Current Config
              </Button>
              <Button
                onClick={() => {
                  setIsAddingNew(false);
                  setNewConfigName('');
                }}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {savedConfigs.length > 0 && <Separator className="bg-slate-600" />}

        {/* Saved Configurations List */}
        <div className="space-y-3">
          {savedConfigs.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No saved OANDA accounts yet</p>
              <p className="text-sm">Add your first account configuration above</p>
            </div>
          ) : (
            savedConfigs.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-600 rounded-lg"
              >
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
                    onClick={() => onLoadConfig(config)}
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:text-white"
                  >
                    Load
                  </Button>
                  
                  <Button
                    onClick={() => handleDeleteConfig(config.id, config.configName)}
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-300 hover:text-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {savedConfigs.length > 0 && (
          <div className="text-xs text-slate-400 mt-4">
            Tip: You can switch between different OANDA accounts by loading saved configurations
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OANDAMultiAccountManager;
