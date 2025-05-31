
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, TrendingUp, TrendingDown, Target, Calendar, Code, Settings } from 'lucide-react';
import { StrategyStorage, StrategyResult } from '@/services/strategyStorage';
import { useToast } from '@/hooks/use-toast';
import { formatDateTimeInTimezone, detectUserTimezone, getTimezoneAbbreviation } from '@/utils/timezoneUtils';

interface SavedStrategiesTabProps {
  onStrategyLoad: (strategy: StrategyResult) => void;
  onNavigateToConfiguration: () => void;
}

const SavedStrategiesTab: React.FC<SavedStrategiesTabProps> = ({ 
  onStrategyLoad, 
  onNavigateToConfiguration 
}) => {
  const [strategies, setStrategies] = useState<StrategyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const userTimezone = detectUserTimezone();
  const timezoneAbbr = getTimezoneAbbreviation();

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      const data = await StrategyStorage.getStrategyResults(50);
      setStrategies(data || []);
    } catch (error) {
      console.error('Failed to load strategies:', error);
      toast({
        title: "Failed to load saved strategies",
        description: "Could not fetch your saved strategy configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadStrategy = (strategy: StrategyResult) => {
    onStrategyLoad(strategy);
    onNavigateToConfiguration();
    
    toast({
      title: "Strategy Loaded",
      description: `"${strategy.strategy_name}" has been loaded into the configuration tab`,
    });
  };

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">Loading saved strategies...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <History className="h-5 w-5" />
            Your Saved Strategies
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Load any of your saved strategy configurations and settings. Times shown in {timezoneAbbr} ({userTimezone})
          </p>
        </CardHeader>
        <CardContent>
          {strategies.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <History className="h-16 w-16 mx-auto mb-4 text-slate-500" />
              <h3 className="text-lg font-medium mb-2">No Saved Strategies</h3>
              <p className="text-sm mb-4">You haven't saved any strategy configurations yet</p>
              <p className="text-xs text-slate-500">
                Create a strategy and save it to see it here
              </p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className="p-5 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Code className="h-5 w-5 text-emerald-400" />
                        <h4 className="text-white font-semibold text-lg truncate max-w-64">
                          {strategy.strategy_name}
                        </h4>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 font-medium">
                        {strategy.symbol.replace('=X', '')} • {strategy.timeframe}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                      <div className="text-center">
                        <div className={`flex items-center justify-center gap-1 ${
                          strategy.total_return > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {strategy.total_return > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          <span className="font-semibold">{strategy.total_return.toFixed(1)}%</span>
                        </div>
                        <p className="text-slate-400 text-xs">Return</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-400">
                          <Target className="h-4 w-4" />
                          <span className="font-semibold">{strategy.win_rate.toFixed(1)}%</span>
                        </div>
                        <p className="text-slate-400 text-xs">Win Rate</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-white font-semibold">{strategy.total_trades}</div>
                        <p className="text-slate-400 text-xs">Trades</p>
                      </div>

                      <div className="text-center">
                        <div className="text-purple-400 font-semibold">
                          {strategy.profit_factor?.toFixed(2) || 'N/A'}
                        </div>
                        <p className="text-slate-400 text-xs">Profit Factor</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {strategy.created_at && formatDateTimeInTimezone(strategy.created_at, userTimezone)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 text-sm"
                        onClick={() => handleLoadStrategy(strategy)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Load Configuration
                      </Button>
                    </div>

                    {/* Strategy preview snippet */}
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <p className="text-xs text-slate-400 mb-1">Strategy Preview:</p>
                      <div className="bg-slate-800 rounded p-2 text-xs text-slate-300 font-mono max-h-16 overflow-hidden">
                        {strategy.strategy_code.split('\n')[0].slice(0, 100)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SavedStrategiesTab;
