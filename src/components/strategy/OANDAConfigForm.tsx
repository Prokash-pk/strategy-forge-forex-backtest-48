
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';
import OANDAEnvironmentSelector from './config/OANDAEnvironmentSelector';
import OANDAConnectionStatus from './config/OANDAConnectionStatus';
import OANDACredentialsForm from './config/OANDACredentialsForm';
import OANDAActionButtons from './config/OANDAActionButtons';
import OANDAErrorDisplay from './config/OANDAErrorDisplay';
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
}

const OANDAConfigForm: React.FC<OANDAConfigFormProps> = ({
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
  persistentConnectionStatus
}) => {
  const { savedStrategies, loadSavedStrategies } = useOANDAStrategies();
  
  // Check if we have persistent connection OR valid credentials
  const isConfiguredForTesting = persistentConnectionStatus === 'connected' || 
                                Boolean(config.accountId?.trim() && config.apiKey?.trim());

  console.log('OANDAConfigForm Debug:', {
    accountId: config.accountId,
    apiKey: config.apiKey ? 'SET' : 'NOT_SET',
    isConfiguredForTesting,
    persistentConnectionStatus,
    connectionStatus,
    canStartTesting,
    isTestingTrade,
    isForwardTestingActive
  });

  const handleConnectOANDA = async () => {
    // For persistent connections, just save the config
    if (persistentConnectionStatus !== 'connected') {
      // First test the connection for new configurations
      await onTestConnection();
    }
    
    // Save the config as persistent
    await onSaveConfig();
  };

  const handleRefreshAll = () => {
    loadSavedStrategies();
    // Trigger refresh of configs from parent
  };

  return (
    <div className="space-y-6">
      {/* Deduplication Tool */}
      <OANDADeduplicationTool
        savedConfigs={savedConfigs}
        savedStrategies={savedStrategies}
        onRefresh={handleRefreshAll}
      />

      {/* Multi-Account Manager */}
      <OANDAMultiAccountManager
        savedConfigs={savedConfigs}
        currentConfig={config}
        onLoadConfig={onLoadConfig}
        onDeleteConfig={onDeleteConfig}
        onSaveNewConfig={onSaveNewConfig}
      />

      {/* Main Configuration Form */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5" />
            {persistentConnectionStatus === 'connected' ? 'OANDA Connected (Persistent)' : 'Configure OANDA Connection'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <OANDAConnectionStatus 
            connectionStatus={persistentConnectionStatus === 'connected' ? 'success' : connectionStatus}
            environment={config.environment}
            accountId={config.accountId}
          />

          {/* Show persistent connection info */}
          {persistentConnectionStatus === 'connected' && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex-1">
                <p className="text-emerald-300 text-sm font-medium">
                  🔐 Persistent Connection Active
                </p>
                <p className="text-emerald-400 text-xs mt-1">
                  Your OANDA credentials are securely stored and will remain connected across browser sessions.
                  You can now close your browser and autonomous trading will continue.
                </p>
              </div>
              {onDisconnectOANDA && (
                <button
                  onClick={onDisconnectOANDA}
                  className="text-emerald-400 hover:text-emerald-300 text-sm underline"
                >
                  Disconnect
                </button>
              )}
            </div>
          )}

          {/* Environment Selection */}
          <OANDAEnvironmentSelector
            environment={config.environment}
            onEnvironmentChange={(value) => onConfigChange('environment', value)}
          />

          <Separator className="bg-slate-600" />

          {/* Credentials Form - only show if not persistently connected */}
          {persistentConnectionStatus !== 'connected' && (
            <>
              <OANDACredentialsForm
                accountId={config.accountId}
                apiKey={config.apiKey}
                onAccountIdChange={(value) => onConfigChange('accountId', value)}
                onApiKeyChange={(value) => onConfigChange('apiKey', value)}
              />

              {/* Setup Instructions */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm font-medium mb-2">
                  💡 One-Time Setup
                </p>
                <p className="text-blue-400 text-xs">
                  Once you connect and save your OANDA credentials, they will be securely stored and you won't need to re-enter them.
                  Your connection will persist across browser sessions for seamless autonomous trading.
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <OANDAActionButtons
            isConfigured={isConfiguredForTesting}
            connectionStatus={persistentConnectionStatus === 'connected' ? 'success' : connectionStatus}
            isLoading={isLoading}
            isTestingTrade={isTestingTrade}
            canStartTesting={canStartTesting}
            isForwardTestingActive={isForwardTestingActive}
            connectionStatusIcon={connectionStatusIcon}
            onConnect={handleConnectOANDA}
            onTestConnection={onTestConnection}
            onSaveConfig={onSaveConfig}
            onTestTrade={onTestTrade}
          />

          {/* Error Display */}
          <OANDAErrorDisplay connectionError={connectionError} />
        </CardContent>
      </Card>

      {/* Connection Diagnostics Tool */}
      {isConfiguredForTesting && (
        <OANDAConnectionTester config={config} />
      )}
    </div>
  );
};

export default OANDAConfigForm;
