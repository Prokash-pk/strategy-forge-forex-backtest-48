
import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestTube } from 'lucide-react';
import OANDAMultiAccountManager from './config/OANDAMultiAccountManager';
import OANDAConnectionTester from './OANDAConnectionTester';
import OANDADeduplicationTool from './config/OANDADeduplicationTool';
import { OANDAConfig, SavedOANDAConfig } from '@/types/oanda';
import { useOANDAStrategies } from '@/hooks/oanda/useOANDAStrategies';

interface OANDAConfigFormProps {
  config: OANDAConfig;
  savedConfigs: SavedOANDAConfig[];
  onConfigChange: (field: keyof OANDAConfig, value: any) => void;
  onTestConnection: () => void;
  onSaveConfig: () => void;
  onSaveNewConfig: (config: OANDAConfig & { configName: string }) => void;
  onLoadConfig: (config: SavedOANDAConfig) => void;
  onDeleteConfig: (configId: string) => void;
  onTestTrade: () => void;
  onDisconnectOANDA?: () => void;
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
  connectionError: string;
  isLoading: boolean;
  isTestingTrade: boolean;
  canStartTesting: boolean;
  isForwardTestingActive: boolean;
  connectionStatusIcon: React.ReactNode;
  persistentConnectionStatus?: 'idle' | 'connected' | 'error';
  loadSavedConfigs?: () => Promise<void>;
}

const OANDAConfigForm: React.FC<OANDAConfigFormProps> = memo(({
  config,
  savedConfigs,
  onConfigChange,
  onTestConnection,
  onSaveConfig,
  onSaveNewConfig,
  onLoadConfig,
  onDeleteConfig,
  onTestTrade,
  onDisconnectOANDA,
  connectionStatus,
  connectionError,
  isLoading,
  isTestingTrade,
  canStartTesting,
  isForwardTestingActive,
  connectionStatusIcon,
  persistentConnectionStatus,
  loadSavedConfigs
}) => {
  const { savedStrategies, loadSavedStrategies } = useOANDAStrategies();
  
  const isConfiguredForTesting = persistentConnectionStatus === 'connected' || 
                                Boolean(config.accountId?.trim() && config.apiKey?.trim());

  const handleRefreshAll = () => {
    loadSavedStrategies();
    if (loadSavedConfigs) {
      loadSavedConfigs();
    }
  };

  return (
    <div className="space-y-6">
      <OANDADeduplicationTool
        savedConfigs={savedConfigs}
        savedStrategies={savedStrategies}
        onRefresh={handleRefreshAll}
      />

      <OANDAMultiAccountManager
        savedConfigs={savedConfigs}
        currentConfig={config}
        onLoadConfig={onLoadConfig}
        onDeleteConfig={onDeleteConfig}
        onSaveNewConfig={onSaveNewConfig}
        onConfigChange={onConfigChange}
        onTestConnection={onTestConnection}
        connectionStatus={connectionStatus}
        connectionError={connectionError}
        isLoading={isLoading}
        persistentConnectionStatus={persistentConnectionStatus}
        onDisconnectOANDA={onDisconnectOANDA}
        loadSavedConfigs={loadSavedConfigs || (() => Promise.resolve())}
      />

      {isConfiguredForTesting && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TestTube className="h-5 w-5" />
              Test Your Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OANDAConnectionTester config={config} />
          </CardContent>
        </Card>
      )}
    </div>
  );
});

OANDAConfigForm.displayName = 'OANDAConfigForm';

export default OANDAConfigForm;
