
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PROVEN_STRATEGIES } from '@/services/analytics/provenStrategies';

interface StrategyQuickLoadProps {
  onStrategyLoad: (strategy: any) => void;
  onImprovedLoad: () => void;
  hasZeroTrades?: boolean;
}

const StrategyQuickLoad: React.FC<StrategyQuickLoadProps> = ({
  onStrategyLoad,
  onImprovedLoad,
  hasZeroTrades = false
}) => {
  const { toast } = useToast();

  const handleQuickLoadStrategy = (provenStrategy: any) => {
    onStrategyLoad({
      name: provenStrategy.strategy_name,
      code: provenStrategy.strategy_code,
      symbol: provenStrategy.symbol,
      timeframe: provenStrategy.timeframe
    });
    
    toast({
      title: "Strategy Loaded",
      description: `Loaded "${provenStrategy.strategy_name}" with ${provenStrategy.win_rate}% win rate`,
    });
  };

  return (
    <div className="flex gap-2">
      {/* Quick Load Proven Strategies Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
          >
            <Zap className="h-4 w-4 mr-2" />
            Quick Load
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 bg-slate-800 border-slate-600">
          {PROVEN_STRATEGIES.map((strategy) => (
            <DropdownMenuItem
              key={strategy.id}
              onClick={() => handleQuickLoadStrategy(strategy)}
              className="cursor-pointer hover:bg-slate-700 p-3"
            >
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white">{strategy.strategy_name}</span>
                  <span className="text-emerald-400 text-sm font-bold">{strategy.win_rate}%</span>
                </div>
                <div className="text-xs text-slate-400 mb-1">
                  {strategy.symbol} • {strategy.timeframe} • {strategy.total_trades} trades
                </div>
                <div className="text-xs text-slate-300">
                  Monthly Return: {(strategy.total_return / 12).toFixed(1)}%
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        onClick={onImprovedLoad}
        variant="outline"
        size="sm"
        className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
      >
        {hasZeroTrades ? 'Fix Zero Trades Issue' : 'Load Improved Version'}
      </Button>
    </div>
  );
};

export default StrategyQuickLoad;
