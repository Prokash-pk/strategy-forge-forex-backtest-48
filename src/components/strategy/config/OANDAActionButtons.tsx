
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, TestTube, Loader2, Wifi, WifiOff } from 'lucide-react';

interface OANDAActionButtonsProps {
  isConfigured: boolean;
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
  isLoading: boolean;
  isTestingTrade: boolean;
  canStartTesting: boolean;
  isForwardTestingActive: boolean;
  connectionStatusIcon: React.ReactNode;
  onConnect: () => void;
  onTestConnection: () => void;
  onSaveConfig: () => void;
  onTestTrade: () => void;
}

const OANDAActionButtons: React.FC<OANDAActionButtonsProps> = ({
  isConfigured,
  connectionStatus,
  isLoading,
  isTestingTrade,
  canStartTesting,
  isForwardTestingActive,
  connectionStatusIcon,
  onConnect,
  onTestConnection,
  onSaveConfig,
  onTestTrade
}) => {
  // Allow test trades even when autonomous trading is active, as long as configured
  const canTestTrade = isConfigured && !isTestingTrade;
  const isConnected = connectionStatus === 'success';

  return (
    <>
      {/* Main Connect Button */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          onClick={onConnect}
          disabled={!isConfigured || connectionStatus === 'testing' || isLoading}
          className={isConnected ? "bg-emerald-600 hover:bg-emerald-700 flex-1" : "bg-blue-600 hover:bg-blue-700 flex-1"}
        >
          {connectionStatus === 'testing' || isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : isConnected ? (
            <>
              <Wifi className="h-4 w-4 mr-2" />
              Reconnect OANDA
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 mr-2" />
              Connect OANDA
            </>
          )}
        </Button>

        {connectionStatusIcon}
      </div>

      {/* Secondary Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={onTestConnection}
          disabled={!isConfigured || connectionStatus === 'testing'}
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:text-white"
        >
          Test Connection
        </Button>

        <Button
          onClick={onSaveConfig}
          disabled={!isConfigured || isLoading}
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Config
        </Button>

        <Button
          onClick={onTestTrade}
          disabled={!canTestTrade}
          variant="outline"
          size="sm"
          className="border-blue-600 text-blue-300 hover:text-blue-200 disabled:opacity-50"
        >
          {isTestingTrade ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <TestTube className="h-4 w-4 mr-2" />
              Test Trade
            </>
          )}
        </Button>
      </div>
    </>
  );
};

export default OANDAActionButtons;
