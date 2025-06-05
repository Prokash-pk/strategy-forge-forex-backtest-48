
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, Square, AlertTriangle, CheckCircle, Globe, Zap } from 'lucide-react';

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
              <Zap className="h-5 w-5 text-emerald-400" />
              Autonomous Trading System
            </>
          ) : (
            <>
              <Square className="h-5 w-5" />
              Autonomous Trading Control
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
                  <Zap className="h-3 w-3 mr-1" />
                  Autonomous
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
              {isForwardTestingActive ? "Autonomous Trading Status" : "Trading Control"}
            </h4>
            <p className="text-slate-400 text-sm">
              {isForwardTestingActive ? (
                <>
                  ✅ Running autonomously 24/7 with {selectedStrategy?.strategy_name}
                  <br />
                  <span className="text-emerald-400 text-xs">
                    🤖 Operates independently - computer can be shut down
                  </span>
                </>
              ) : (
                "Autonomous trading is currently stopped"
              )}
            </p>
            {canStartTesting && !isForwardTestingActive && (
              <p className="text-emerald-400 text-sm mt-1">✅ Ready to start autonomous trading</p>
            )}
          </div>
          <Button
            onClick={onToggleForwardTesting}
            className={isForwardTestingActive 
              ? "bg-red-600 hover:bg-red-700" 
              : "bg-emerald-600 hover:bg-emerald-700"
            }
          >
            {isForwardTestingActive ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Autonomous Trading
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Start Autonomous Trading
              </>
            )}
          </Button>
        </div>

        {isForwardTestingActive && (
          <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <Zap className="h-4 w-4 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-emerald-300 text-sm font-medium">
                Autonomous Trading Active
              </p>
              <p className="text-emerald-400 text-xs mt-1">
                • Strategy runs autonomously on our servers 24/7<br />
                • Trading continues when you close browser/shut down computer<br />
                • OANDA credentials securely stored server-side<br />
                • Trades execute automatically every 5 minutes via cron job<br />
                • Zero dependency on your internet connection or device
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
                  ? "Autonomous trading will attempt to start with current settings. Configure OANDA credentials for optimal performance."
                  : connectionStatus !== 'success'
                  ? "Autonomous trading will attempt to start. Test connection first for validation."
                  : !selectedStrategy
                  ? "Autonomous trading will attempt to start. Select a strategy for better results."
                  : "Ready to start autonomous trading!"
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
