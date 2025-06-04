
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SavedOANDAConfig, OANDAConfig } from '@/types/oanda';
import AccountManagerHeader from './multi-account/AccountManagerHeader';
import AddAccountForm from './multi-account/AddAccountForm';
import AccountConfigCard from './multi-account/AccountConfigCard';
import EmptyStateDisplay from './multi-account/EmptyStateDisplay';
import OANDAConfigurationSection from './multi-account/OANDAConfigurationSection';
import { useAccountManager } from './multi-account/useAccountManager';

interface OANDAMultiAccountManagerProps {
  savedConfigs: SavedOANDAConfig[];
  currentConfig: OANDAConfig;
  onLoadConfig: (config: SavedOANDAConfig) => void;
  onDeleteConfig: (configId: string) => Promise<void>;
  onSaveNewConfig: (config: OANDAConfig & { configName: string }) => Promise<void>;
  onConfigChange: (field: keyof OANDAConfig, value: any) => void;
  onTestConnection: () => void;
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
  connectionError: string;
  isLoading: boolean;
  persistentConnectionStatus?: 'idle' | 'connected' | 'error';
  onDisconnectOANDA?: () => void;
  loadSavedConfigs: () => Promise<void>;
}

const OANDAMultiAccountManager: React.FC<OANDAMultiAccountManagerProps> = ({
  savedConfigs,
  currentConfig,
  onLoadConfig,
  onDeleteConfig,
  onSaveNewConfig,
  onConfigChange,
  onTestConnection,
  connectionStatus,
  connectionError,
  isLoading,
  persistentConnectionStatus,
  onDisconnectOANDA,
  loadSavedConfigs
}) => {
  const {
    isAddingNew,
    newConfigName,
    setNewConfigName,
    handleSaveCurrentConfig,
    handleDeleteConfig,
    handleAddAccount,
    handleCancel,
    isSaving
  } = useAccountManager({
    currentConfig,
    onSaveNewConfig,
    onDeleteConfig,
    loadSavedConfigs
  });

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <AccountManagerHeader onAddAccount={handleAddAccount} />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Only show OANDA Configuration Section when adding new account */}
        {isAddingNew && (
          <>
            <OANDAConfigurationSection
              config={currentConfig}
              onConfigChange={onConfigChange}
              onTestConnection={onTestConnection}
              connectionStatus={connectionStatus}
              connectionError={connectionError}
              isLoading={isLoading}
              persistentConnectionStatus={persistentConnectionStatus}
              onDisconnectOANDA={onDisconnectOANDA}
            />

            <Separator className="bg-slate-600" />

            {/* Add New Configuration Form - only show when connection is successful */}
            {connectionStatus === 'success' && (
              <>
                <AddAccountForm
                  configName={newConfigName}
                  onConfigNameChange={setNewConfigName}
                  onSave={handleSaveCurrentConfig}
                  onCancel={handleCancel}
                  isSaving={isSaving}
                />

                <Separator className="bg-slate-600" />
              </>
            )}
          </>
        )}

        {/* Saved Configurations List */}
        <div className="space-y-3">
          {savedConfigs.length === 0 && !isAddingNew ? (
            <EmptyStateDisplay />
          ) : (
            savedConfigs.map((config) => (
              <AccountConfigCard
                key={config.id}
                config={config}
                onLoad={onLoadConfig}
                onDelete={(configId: string, configName: string) => handleDeleteConfig(configId, configName)}
                onTestTrade={() => {
                  console.log('Test trade for config:', config.id);
                }}
              />
            ))
          )}
        </div>

        {savedConfigs.length > 0 && (
          <div className="text-xs text-slate-400 mt-4">
            💡 Each account stays connected 24/7 once configured. Switch between accounts by loading different configurations.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OANDAMultiAccountManager;
