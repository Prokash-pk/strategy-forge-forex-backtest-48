
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, AlertTriangle, Save, TestTube, Loader2 } from 'lucide-react';

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
  const isConfigured = config.accountId && config.apiKey;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Settings className="h-5 w-5" />
          API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Environment Selection */}
        <div className="space-y-2">
          <Label htmlFor="environment" className="text-slate-300">Environment</Label>
          <Select
            value={config.environment}
            onValueChange={(value: 'practice' | 'live') => onConfigChange('environment', value)}
          >
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="practice" className="text-white">
                <div className="flex items-center gap-2">
                  <span>Practice (Demo)</span>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-xs">Recommended</Badge>
                </div>
              </SelectItem>
              <SelectItem value="live" className="text-white">
                <div className="flex items-center gap-2">
                  <span>Live Trading</span>
                  <Badge variant="secondary" className="bg-red-500/10 text-red-400 text-xs">Advanced</Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {config.environment === 'live' && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
              <p className="text-red-300 text-sm">
                Warning: Live trading involves real money. Only use this mode with thoroughly tested strategies.
              </p>
            </div>
          )}
        </div>

        <Separator className="bg-slate-600" />

        {/* Account ID */}
        <div className="space-y-2">
          <Label htmlFor="accountId" className="text-slate-300">Account ID</Label>
          <Input
            id="accountId"
            type="text"
            placeholder="101-001-12345678-001"
            value={config.accountId}
            onChange={(e) => onConfigChange('accountId', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
          />
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <Label htmlFor="apiKey" className="text-slate-300">API Token</Label>
          <Input
            id="apiKey"
            type="password"
            placeholder="Enter your OANDA API token"
            value={config.apiKey}
            onChange={(e) => onConfigChange('apiKey', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onTestConnection}
            disabled={!config.accountId || !config.apiKey || connectionStatus === 'testing'}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            {connectionStatus === 'testing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>

          <Button
            onClick={onSaveConfig}
            disabled={!isConfigured || isLoading}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Config
              </>
            )}
          </Button>

          <Button
            onClick={onTestTrade}
            disabled={!canStartTesting || isTestingTrade || isForwardTestingActive}
            variant="outline"
            className="border-blue-600 text-blue-300 hover:text-blue-200 disabled:opacity-50"
          >
            {isTestingTrade ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Trade...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Test Trade
              </>
            )}
          </Button>
          
          {connectionStatusIcon}
          
          {connectionStatus === 'success' && (
            <span className="text-emerald-400 text-sm">Connection verified</span>
          )}
          
          {connectionStatus === 'error' && (
            <span className="text-red-400 text-sm">Connection failed</span>
          )}
        </div>

        {connectionError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-300 text-sm">{connectionError}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OANDAConfigForm;
