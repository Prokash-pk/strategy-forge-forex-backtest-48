
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Wifi, Shield, Loader2, TestTube } from 'lucide-react';
import OANDAEnvironmentSelector from '../OANDAEnvironmentSelector';
import OANDACredentialsForm from '../OANDACredentialsForm';
import OANDAConnectionStatus from '../OANDAConnectionStatus';
import OANDAErrorDisplay from '../OANDAErrorDisplay';
import { OANDAConfig } from '@/types/oanda';

interface OANDAConfigurationSectionProps {
  config: OANDAConfig;
  onConfigChange: (field: keyof OANDAConfig, value: any) => void;
  onTestConnection: () => void;
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
  connectionError: string;
  isLoading: boolean;
  persistentConnectionStatus?: 'idle' | 'connected' | 'error';
  onDisconnectOANDA?: () => void;
}

const OANDAConfigurationSection: React.FC<OANDAConfigurationSectionProps> = ({
  config,
  onConfigChange,
  onTestConnection,
  connectionStatus,
  connectionError,
  isLoading,
  persistentConnectionStatus,
  onDisconnectOANDA
}) => {
  const isConfigured = Boolean(config.accountId?.trim() && config.apiKey?.trim());
  const isPersistentlyConnected = persistentConnectionStatus === 'connected';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-slate-300" />
          <h3 className="text-white font-medium">
            {isPersistentlyConnected ? 'Connected Account' : 'Configure New Account'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isPersistentlyConnected && (
            <Badge variant="default" className="bg-emerald-600">
              <Shield className="h-3 w-3 mr-1" />
              24/7 Connected
            </Badge>
          )}
          {connectionStatus === 'success' && !isPersistentlyConnected && (
            <Badge variant="default" className="bg-emerald-600">
              Tested
            </Badge>
          )}
        </div>
      </div>

      {isPersistentlyConnected && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <Shield className="h-4 w-4 text-emerald-400" />
          <div className="flex-1">
            <p className="text-emerald-300 text-sm font-medium">
              🔐 Account Connected 24/7
            </p>
            <p className="text-emerald-400 text-xs mt-1">
              {config.environment === 'practice' ? 'Practice' : 'Live'} Account: {config.accountId}
            </p>
          </div>
          {onDisconnectOANDA && (
            <Button
              onClick={onDisconnectOANDA}
              size="sm"
              variant="outline"
              className="border-emerald-600 text-emerald-300 hover:text-emerald-200"
            >
              Disconnect
            </Button>
          )}
        </div>
      )}

      <OANDAConnectionStatus 
        connectionStatus={isPersistentlyConnected ? 'success' : connectionStatus}
        environment={config.environment}
        accountId={config.accountId}
      />

      {!isPersistentlyConnected && (
        <>
          <OANDAEnvironmentSelector
            environment={config.environment}
            onEnvironmentChange={(value) => onConfigChange('environment', value)}
          />

          <OANDACredentialsForm
            accountId={config.accountId}
            apiKey={config.apiKey}
            onAccountIdChange={(value) => onConfigChange('accountId', value)}
            onApiKeyChange={(value) => onConfigChange('apiKey', value)}
          />

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-300 text-sm font-medium mb-2">
              💡 One-Time Setup
            </p>
            <p className="text-blue-400 text-xs">
              Configure your credentials once and your account will stay connected 24/7. 
              You can add multiple accounts and switch between them anytime.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={onTestConnection}
              disabled={!isConfigured || connectionStatus === 'testing'}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {connectionStatus === 'testing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing & Connecting...
                </>
              ) : connectionStatus === 'success' ? (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Connected - Ready to Save
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test & Connect
                </>
              )}
            </Button>
          </div>

          <OANDAErrorDisplay connectionError={connectionError} />
        </>
      )}
    </div>
  );
};

export default OANDAConfigurationSection;
