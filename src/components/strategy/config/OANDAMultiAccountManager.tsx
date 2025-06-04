
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SavedOANDAConfig, OANDAConfig } from '@/types/oanda';
import AccountManagerHeader from './multi-account/AccountManagerHeader';
import AddAccountForm from './multi-account/AddAccountForm';
import AccountConfigCard from './multi-account/AccountConfigCard';
import EmptyStateDisplay from './multi-account/EmptyStateDisplay';
import { useAccountManager } from './multi-account/useAccountManager';

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
  const {
    isAddingNew,
    newConfigName,
    setNewConfigName,
    handleSaveCurrentConfig,
    handleDeleteConfig,
    handleAddAccount,
    handleCancel
  } = useAccountManager({
    currentConfig,
    onSaveNewConfig,
    onDeleteConfig
  });

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <AccountManagerHeader onAddAccount={handleAddAccount} />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Configuration Form */}
        {isAddingNew && (
          <AddAccountForm
            configName={newConfigName}
            onConfigNameChange={setNewConfigName}
            onSave={handleSaveCurrentConfig}
            onCancel={handleCancel}
          />
        )}

        {savedConfigs.length > 0 && <Separator className="bg-slate-600" />}

        {/* Saved Configurations List */}
        <div className="space-y-3">
          {savedConfigs.length === 0 ? (
            <EmptyStateDisplay />
          ) : (
            savedConfigs.map((config) => (
              <AccountConfigCard
                key={config.id}
                config={config}
                onLoad={onLoadConfig}
                onDelete={handleDeleteConfig}
              />
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
