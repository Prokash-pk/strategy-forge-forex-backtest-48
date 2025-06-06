
import React from 'react';
import { Button } from '@/components/ui/button';
import { Square, Zap } from 'lucide-react';

interface StrategySettings {
  id: string;
  strategy_name: string;
  symbol: string;
  timeframe: string;
}

interface TradingActionButtonProps {
  isForwardTestingActive: boolean;
  selectedStrategy: StrategySettings | null;
  isButtonDisabled: boolean;
  onToggleForwardTesting: () => void;
}

export const TradingActionButton: React.FC<TradingActionButtonProps> = ({
  isForwardTestingActive,
  selectedStrategy,
  isButtonDisabled,
  onToggleForwardTesting
}) => {
  return (
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
  );
};
