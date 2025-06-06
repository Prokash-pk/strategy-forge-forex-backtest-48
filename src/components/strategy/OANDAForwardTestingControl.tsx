
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, Square, AlertTriangle, CheckCircle, Globe, Zap, Settings } from 'lucide-react';

interface StrategySettings {
  id: string;
  strategy_name: string;
  symbol: string;
  timeframe: string;
}

interface OANDAForwardTestingControlProps {
  isForwardTestingActive: boolean;
  selectedStrategy: StrategySettings | null;
  config: {
    environment: 'practice' | 'live';
    accountId?: string;
    apiKey?: string;
  };
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
  // Auto-start preference management
  const autoStartEnabled = localStorage.getItem('autoStartForwardTesting') === 'true';
  
  const toggleAutoStart = () => {
    const newValue = !autoStartEnabled;
    localStorage.setItem('autoStartForwardTesting', String(newValue));
    window.location.reload(); // Simple way to update state
  };

  // Determine if the button should be disabled
  const isButtonDisabled = !isConfigured || 
                           !selectedStrategy || 
                           connectionStatus !== 'success' ||
                           !config.accountId ||
                           !config.apiKey;

  console.log('🔍 Button state debug:', {
    isConfigured,
    selectedStrategy: !!selectedStrategy,
    connectionStatus,
    accountId: !!config.accountId,
    apiKey: !!config.apiKey,
    isButtonDisabled,
    canStartTesting,
    isForwardTestingActive
  });

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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">
              Strategy: {selectedStrategy ? selectedStrategy.strategy_name : "No strategy selected"}
            </h3>
            <p className="text-slate-400 text-sm">
              {selectedStrategy ? `${selectedStrategy.symbol} • ${selectedStrategy.timeframe}` : "Please select a strategy above"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isForwardTestingActive ? "default" : "secondary"}
              className={isForwardTestingActive ? "bg-emerald-600 animate-pulse" : "bg-slate-600"}
            >
              {isForwardTestingActive ? (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  LIVE TRADES
                </>
              ) : (
                "Inactive"
              )}
            </Badge>
          </div>
        </div>

        <Separator className="bg-slate-600" />

        {/* Auto-start setting */}
        <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
          <div>
            <h4 className="text-white text-sm font-medium">Auto-Start Trading</h4>
            <p className="text-slate-400 text-xs">Automatically start when strategy and OANDA are ready</p>
          </div>
          <Button
            variant={autoStartEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleAutoStart}
            className={autoStartEnabled ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            <Settings className="h-3 w-3 mr-1" />
            {autoStartEnabled ? "ON" : "OFF"}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium mb-1">
              {isForwardTestingActive ? "Live Trading Status" : "Trading Control"}
            </h4>
            <p className="text-slate-400 text-sm">
              {isForwardTestingActive ? (
                <>
                  ✅ Executing REAL trades with {selectedStrategy?.strategy_name}
                  <br />
                  <span className="text-emerald-400 text-xs">
                    💰 Strategy signals = ACTUAL OANDA trades every 1 minute
                  </span>
                </>
              ) : (
                "Live trading is currently stopped - no real trades will be executed"
              )}
            </p>
            {!isButtonDisabled && !isForwardTestingActive && (
              <p className="text-emerald-400 text-sm mt-1">✅ Ready to start live trading</p>
            )}
          </div>
          <Button
            onClick={onToggleForwardTesting}
            disabled={isButtonDisabled && !isForwardTestingActive}
            className={isForwardTestingActive 
              ? "bg-red-600 hover:bg-red-700" 
              : "bg-emerald-600 hover:bg-emerald-700"
            }
          >
            {isForwardTestingActive ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Live Trading
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Start Live Trading
              </>
            )}
          </Button>
        </div>

        {isForwardTestingActive && (
          <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <Zap className="h-4 w-4 text-emerald-400 mt-0.5 animate-pulse" />
            <div>
              <p className="text-emerald-300 text-sm font-medium">
                🚀 LIVE TRADING ACTIVE
              </p>
              <p className="text-emerald-400 text-xs mt-1">
                • Your strategy is executing REAL trades on OANDA<br />
                • Every strategy signal becomes an actual trade<br />
                • Trades execute automatically every 1 minute<br />
                • Check your OANDA account for trade confirmations<br />
                • Money is at risk - monitor your account balance
              </p>
            </div>
          </div>
        )}

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-2 bg-slate-700/30 rounded text-xs text-slate-400">
            <div>Debug Info:</div>
            <div>• Configured: {isConfigured ? 'Yes' : 'No'}</div>
            <div>• Strategy: {selectedStrategy ? 'Selected' : 'None'}</div>
            <div>• Connection: {connectionStatus}</div>
            <div>• Account ID: {config.accountId ? 'Set' : 'Missing'}</div>
            <div>• API Key: {config.apiKey ? 'Set' : 'Missing'}</div>
            <div>• Button Disabled: {isButtonDisabled ? 'Yes' : 'No'}</div>
          </div>
        )}

        {(isButtonDisabled && !isForwardTestingActive) && (
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
            <div>
              <p className="text-amber-300 text-sm">
                {!isConfigured 
                  ? "Configure OANDA credentials and select a strategy to enable live trading."
                  : connectionStatus !== 'success'
                  ? "Test OANDA connection first to enable live trading."
                  : !selectedStrategy
                  ? "Select a strategy above to enable live trading."
                  : !config.accountId || !config.apiKey
                  ? "Complete OANDA configuration (Account ID and API Key required)."
                  : "Ready to start live trading!"
                }
              </p>
              {!isConfigured && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShowGuide}
                  className="text-amber-400 hover:text-amber-300 p-0 h-auto mt-1"
                >
                  View Setup Guide →
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OANDAForwardTestingControl;
