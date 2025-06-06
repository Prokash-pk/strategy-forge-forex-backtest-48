
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Square, Zap } from 'lucide-react';
import { useAutoStartPreference } from './forward-testing/useAutoStartPreference';
import { useButtonState, type StrategySettings, type Config } from './forward-testing/useButtonState';
import { AutoStartToggle } from './forward-testing/AutoStartToggle';
import { TradingStatusDisplay } from './forward-testing/TradingStatusDisplay';
import { TradingActionButton } from './forward-testing/TradingActionButton';
import { ActiveTradingAlert } from './forward-testing/ActiveTradingAlert';
import { DebugInformation } from './forward-testing/DebugInformation';
import { ConfigurationWarning } from './forward-testing/ConfigurationWarning';

interface OANDAForwardTestingControlProps {
  isForwardTestingActive: boolean;
  selectedStrategy: StrategySettings | null;
  config: Config;
  canStartTesting: boolean;
  isConfigured: boolean;
  connectionStatus: string;
  onToggleForwardTesting: () => void;
  onShowGuide: () => void;
}

const OANDAForwardTestingControl: React.FC<OANDAForwardTestingControlProps> = ({
  isForwardTestingActive,
  selectedStrategy,
  config,
  canStartTesting,
  isConfigured,
  connectionStatus,
  onToggleForwardTesting,
  onShowGuide
}) => {
  const { autoStartEnabled, toggleAutoStart } = useAutoStartPreference();
  const { isButtonDisabled } = useButtonState(isConfigured, selectedStrategy, connectionStatus, config);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          {isForwardTestingActive ? (
            <>
              <Zap className="h-5 w-5 text-emerald-400 animate-pulse" />
              LIVE TRADING ACTIVE - Real Trades Being Executed
            </>
          ) : (
            <>
              <Square className="h-5 w-5" />
              Live Trading Control
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TradingStatusDisplay 
          selectedStrategy={selectedStrategy}
          isForwardTestingActive={isForwardTestingActive}
          isButtonDisabled={isButtonDisabled}
        />

        <Separator className="bg-slate-600" />

        <AutoStartToggle 
          autoStartEnabled={autoStartEnabled}
          onToggle={toggleAutoStart}
        />

        <TradingActionButton 
          isForwardTestingActive={isForwardTestingActive}
          selectedStrategy={selectedStrategy}
          isButtonDisabled={isButtonDisabled}
          onToggleForwardTesting={onToggleForwardTesting}
        />

        {isForwardTestingActive && <ActiveTradingAlert />}

        <DebugInformation 
          isConfigured={isConfigured}
          selectedStrategy={selectedStrategy}
          connectionStatus={connectionStatus}
          config={config}
          isButtonDisabled={isButtonDisabled}
        />

        {(isButtonDisabled && !isForwardTestingActive) && (
          <ConfigurationWarning 
            isConfigured={isConfigured}
            selectedStrategy={selectedStrategy}
            connectionStatus={connectionStatus}
            config={config}
            onShowGuide={onShowGuide}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default OANDAForwardTestingControl;
