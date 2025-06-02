import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { SavedOANDAConfig, StrategySettings } from '@/types/oanda';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OANDADeduplicationToolProps {
  savedConfigs: SavedOANDAConfig[];
  savedStrategies: StrategySettings[];
  onRefresh: () => void;
}

const OANDADeduplicationTool: React.FC<OANDADeduplicationToolProps> = ({
  savedConfigs,
  savedStrategies,
  onRefresh
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const findDuplicateConfigs = () => {
    const configMap = new Map<string, SavedOANDAConfig[]>();
    
    savedConfigs.forEach(config => {
      const key = `${config.accountId}-${config.environment}`;
      if (!configMap.has(key)) {
        configMap.set(key, []);
      }
      configMap.get(key)!.push(config);
    });

    return Array.from(configMap.values()).filter(configs => configs.length > 1);
  };

  const findDuplicateStrategies = () => {
    const strategyMap = new Map<string, StrategySettings[]>();
    
    savedStrategies.forEach(strategy => {
      const key = `${strategy.strategy_name}-${strategy.symbol}-${strategy.timeframe}`;
      if (!strategyMap.has(key)) {
        strategyMap.set(key, []);
      }
      strategyMap.get(key)!.push(strategy);
    });

    return Array.from(strategyMap.values()).filter(strategies => strategies.length > 1);
  };

  const removeDuplicateConfigs = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const duplicateGroups = findDuplicateConfigs();
      let removedCount = 0;

      for (const group of duplicateGroups) {
        // Keep the most recent one, remove the rest
        const sortedGroup = group.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        const toRemove = sortedGroup.slice(1); // Keep first (most recent), remove rest
        
        for (const config of toRemove) {
          const { error } = await supabase
            .from('oanda_configs')
            .delete()
            .eq('id', config.id)
            .eq('user_id', user.id);

          if (!error) {
            removedCount++;
          }
        }
      }

      toast({
        title: "Duplicates Removed",
        description: `Removed ${removedCount} duplicate OANDA configurations`,
      });

      onRefresh();
    } catch (error) {
      console.error('Failed to remove duplicate configs:', error);
      toast({
        title: "Cleanup Failed",
        description: "Could not remove duplicate configurations",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeDuplicateStrategies = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const duplicateGroups = findDuplicateStrategies();
      let removedCount = 0;

      for (const group of duplicateGroups) {
        // Keep the most recent one, remove the rest
        const sortedGroup = group.sort((a, b) => 
          new Date(b.id).localeCompare(new Date(a.id).toISOString())
        );
        
        const toRemove = sortedGroup.slice(1); // Keep first (most recent), remove rest
        
        for (const strategy of toRemove) {
          const { error } = await supabase
            .from('strategy_results')
            .delete()
            .eq('id', strategy.id)
            .eq('user_id', user.id);

          if (!error) {
            removedCount++;
          }
        }
      }

      toast({
        title: "Duplicates Removed",
        description: `Removed ${removedCount} duplicate strategies`,
      });

      onRefresh();
    } catch (error) {
      console.error('Failed to remove duplicate strategies:', error);
      toast({
        title: "Cleanup Failed",
        description: "Could not remove duplicate strategies",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const duplicateConfigs = findDuplicateConfigs();
  const duplicateStrategies = findDuplicateStrategies();
  const totalDuplicateConfigs = duplicateConfigs.reduce((sum, group) => sum + group.length - 1, 0);
  const totalDuplicateStrategies = duplicateStrategies.reduce((sum, group) => sum + group.length - 1, 0);

  if (totalDuplicateConfigs === 0 && totalDuplicateStrategies === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            No Duplicates Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">Your OANDA configurations and strategies are clean - no duplicates detected.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <AlertTriangle className="h-5 w-5 text-orange-400" />
          Duplicate Cleanup Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalDuplicateConfigs > 0 && (
          <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-white font-medium">Duplicate OANDA Configurations</h4>
                <p className="text-slate-400 text-sm">
                  Found {totalDuplicateConfigs} duplicate configurations across {duplicateConfigs.length} groups
                </p>
              </div>
              <Badge variant="destructive">{totalDuplicateConfigs} duplicates</Badge>
            </div>
            
            <div className="space-y-2 mb-3">
              {duplicateConfigs.map((group, index) => (
                <div key={index} className="text-sm text-slate-300">
                  • {group[0].accountId} ({group[0].environment}) - {group.length} copies
                </div>
              ))}
            </div>

            <Button
              onClick={removeDuplicateConfigs}
              disabled={isProcessing}
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Duplicate Configs
            </Button>
          </div>
        )}

        {totalDuplicateStrategies > 0 && (
          <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-white font-medium">Duplicate Strategies</h4>
                <p className="text-slate-400 text-sm">
                  Found {totalDuplicateStrategies} duplicate strategies across {duplicateStrategies.length} groups
                </p>
              </div>
              <Badge variant="destructive">{totalDuplicateStrategies} duplicates</Badge>
            </div>
            
            <div className="space-y-2 mb-3">
              {duplicateStrategies.map((group, index) => (
                <div key={index} className="text-sm text-slate-300">
                  • {group[0].strategy_name} ({group[0].symbol}, {group[0].timeframe}) - {group.length} copies
                </div>
              ))}
            </div>

            <Button
              onClick={removeDuplicateStrategies}
              disabled={isProcessing}
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Duplicate Strategies
            </Button>
          </div>
        )}

        <div className="text-xs text-slate-400 mt-4">
          <p>⚠️ This will keep the most recent copy of each duplicate and remove the older ones.</p>
          <p>This action cannot be undone.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OANDADeduplicationTool;
