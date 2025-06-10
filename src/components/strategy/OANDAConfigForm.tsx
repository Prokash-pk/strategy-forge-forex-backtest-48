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
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
  connectionError: string;
  isConnected?: boolean;
  lastConnectedAt?: string | null;
  accountInfo?: any | null;
  isLoading: boolean;
  isTestingTrade: boolean;
  canStartTesting: boolean;
  isForwardTestingActive: boolean;
  connectionStatusIcon: React.ReactNode;
  connectionProps?: {
    retryCount?: number;
    isAutoReconnecting?: boolean;
  };
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
  connectionStatus,
  connectionError,
  isConnected = false,
  lastConnectedAt,
  accountInfo,
  isLoading,
  isTestingTrade,
  canStartTesting,
  isForwardTestingActive,
  connectionStatusIcon,
  connectionProps
}) => {
  const { savedStrategies, loadSavedStrategies } = useOANDAStrategies();
  
  const isConfiguredForTesting = Boolean(config.accountId?.trim() && config.apiKey?.trim());

  const handleManualConnect = async () => {
    console.log('🔄 User manually connecting to OANDA...');
    
    // Stop any auto-reconnection attempts
    if (connectionProps?.isAutoReconnecting) {
      console.log('⏹️ Stopping auto-reconnect for manual connection');
    }
    
    // Test the connection manually
    await onTestConnection();
    
    // Save the config for future use
    if (isConfiguredForTesting) {
      await onSaveConfig();
    }
  };

  const handleRefreshAll = () => {
    loadSavedStrategies();
  };

  return (
    <div className="space-y-6">
      {/* Connection status message for auto-reconnecting */}
      {connectionProps?.isAutoReconnecting && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-300 text-sm">
            ⚠️ Auto-reconnecting... You can click "Connect OANDA" to stop auto-reconnect and connect manually.
          </p>
        </div>
      )}

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
            Configure OANDA Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enhanced Connection Status */}
          <OANDAConnectionStatus 
            connectionStatus={connectionStatus}
            environment={config.environment}
            accountId={config.accountId}
            isConnected={isConnected}
            lastConnectedAt={lastConnectedAt}
            accountInfo={accountInfo}
            retryCount={connectionProps?.retryCount}
            isAutoReconnecting={connectionProps?.isAutoReconnecting}
          />

          {/* Environment Selection */}
          <OANDAEnvironmentSelector
            environment={config.environment}
            onEnvironmentChange={(value) => onConfigChange('environment', value)}
          />

          <Separator className="bg-slate-600" />

          {/* Credentials Form */}
          <OANDACredentialsForm
            accountId={config.accountId}
            apiKey={config.apiKey}
            onAccountIdChange={(value) => onConfigChange('accountId', value)}
            onApiKeyChange={(value) => onConfigChange('apiKey', value)}
          />

          {/* Action Buttons */}
          <OANDAActionButtons
            isConfigured={isConfiguredForTesting}
            connectionStatus={connectionStatus}
            isLoading={isLoading}
            isTestingTrade={isTestingTrade}
            canStartTesting={canStartTesting}
            isForwardTestingActive={isForwardTestingActive}
            connectionStatusIcon={connectionStatusIcon}
            onConnect={handleManualConnect}
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
