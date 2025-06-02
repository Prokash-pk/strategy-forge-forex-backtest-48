
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
import { OANDAConfig, SavedOANDAConfig } from '@/types/oanda';

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
  isLoading: boolean;
  isTestingTrade: boolean;
  canStartTesting: boolean;
  isForwardTestingActive: boolean;
  connectionStatusIcon: React.ReactNode;
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
  isLoading,
  isTestingTrade,
  canStartTesting,
  isForwardTestingActive,
  connectionStatusIcon
}) => {
  const isConfigured = !!(config.accountId && config.apiKey);

  const handleConnectOANDA = async () => {
    // First test the connection
    await onTestConnection();
    
    // If connection is successful, save the config
    if (connectionStatus === 'success' || isConfigured) {
      await onSaveConfig();
    }
  };

  return (
    <div className="space-y-6">
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
          {/* Connection Status */}
          <OANDAConnectionStatus 
            connectionStatus={connectionStatus}
            environment={config.environment}
            accountId={config.accountId}
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
            isConfigured={isConfigured}
            connectionStatus={connectionStatus}
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
      {isConfigured && (
        <OANDAConnectionTester config={config} />
      )}
    </div>
  );
};

export default OANDAConfigForm;
