
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, Square, AlertTriangle, CheckCircle, Globe } from 'lucide-react';

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
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          {isForwardTestingActive ? (
            <>
              <Globe className="h-5 w-5 text-emerald-400" />
              Server-Side Forward Testing
            </>
          ) : (
            <>
              <Square className="h-5 w-5" />
              Forward Testing Control
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
              className={isForwardTestingActive ? "bg-emerald-600" : "bg-slate-600"}
            >
              {isForwardTestingActive ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Server Active
                </>
              ) : (
                "Inactive"
              )}
            </Badge>
          </div>
        </div>

        <Separator className="bg-slate-600" />

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium mb-1">
              {isForwardTestingActive ? "Server-Side Trading Status" : "Forward Testing Status"}
            </h4>
            <p className="text-slate-400 text-sm">
              {isForwardTestingActive ? (
                <>
                  ✅ Running continuously on server with {selectedStrategy?.strategy_name}
                  <br />
                  <span className="text-emerald-400 text-xs">
                    🌐 Trading continues even when browser is closed
                  </span>
                </>
              ) : (
                "Forward testing is currently stopped"
              )}
            </p>
            {canStartTesting && !isForwardTestingActive && (
              <p className="text-emerald-400 text-sm mt-1">✅ Ready to start server-side forward testing</p>
            )}
          </div>
          <Button
            onClick={onToggleForwardTesting}
            disabled={!canStartTesting && !isForwardTestingActive}
            className={isForwardTestingActive 
              ? "bg-red-600 hover:bg-red-700" 
              : "bg-emerald-600 hover:bg-emerald-700"
            }
          >
            {isForwardTestingActive ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Server Trading
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Start Server Trading
              </>
            )}
          </Button>
        </div>

        {isForwardTestingActive && (
          <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-emerald-300 text-sm font-medium">
                Server-Side Trading Active
              </p>
              <p className="text-emerald-400 text-xs mt-1">
                • Your strategy is running on our servers 24/7<br />
                • Trading continues even when you're offline<br />
                • OANDA credentials are securely stored<br />
                • Trades execute automatically via cron job every 5 minutes
              </p>
            </div>
          </div>
        )}

        {!canStartTesting && !isForwardTestingActive && (
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
            <div>
              <p className="text-amber-300 text-sm">
                {!isConfigured 
                  ? "Please configure your OANDA API credentials above."
                  : connectionStatus !== 'success'
                  ? "Please test your connection first to verify credentials."
                  : !selectedStrategy
                  ? "Please select a strategy with saved settings above."
                  : "Ready to start server-side forward testing!"
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
