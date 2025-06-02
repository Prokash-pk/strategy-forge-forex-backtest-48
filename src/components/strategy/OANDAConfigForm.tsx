
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';
import OANDAEnvironmentSelector from './config/OANDAEnvironmentSelector';
import OANDAConnectionStatus from './config/OANDAConnectionStatus';
import OANDACredentialsForm from './config/OANDACredentialsForm';
import OANDAActionButtons from './config/OANDAActionButtons';
import OANDAErrorDisplay from './config/OANDAErrorDisplay';

interface OANDAConfig {
  accountId: string;
  apiKey: string;
  environment: 'practice' | 'live';
  enabled: boolean;
}

interface OANDAConfigFormProps {
  config: OANDAConfig;
  onConfigChange: (field: keyof OANDAConfig, value: any) => void;
  onTestConnection: () => void;
  onSaveConfig: () => void;
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
  onConfigChange,
  onTestConnection,
  onSaveConfig,
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
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Settings className="h-5 w-5" />
          Connect OANDA
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
  );
};

export default OANDAConfigForm;
