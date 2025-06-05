
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StrategySettings } from '@/types/oanda';

export const useOANDAStrategies = () => {
  const { toast } = useToast();
  const [savedStrategies, setSavedStrategies] = useState<StrategySettings[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategySettings | null>(null);

  // Load selected strategy on component mount
  useEffect(() => {
    loadSelectedStrategy();
  }, []);

  const loadSelectedStrategy = () => {
    const saved = localStorage.getItem('selected_strategy_settings');
    console.log('Loading selected strategy from localStorage:', saved);
    if (saved) {
      try {
        const strategySettings = JSON.parse(saved);
        console.log('Parsed strategy settings:', strategySettings);
        setSelectedStrategy(strategySettings);
      } catch (error) {
        console.error('Failed to load selected strategy:', error);
      }
    }
  };

  const loadSavedStrategies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, cannot load strategies');
        return;
      }

      console.log('Loading saved strategies for user:', user.id);

      const { data, error } = await supabase
        .from('strategy_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading strategies:', error);
        throw error;
      }
      
      console.log('Loaded strategies from database:', data);
      
      // Filter for strategies that contain "smart momentum" in the name
      const smartMomentumStrategies = data?.filter(strategy => 
        strategy.strategy_name?.toLowerCase().includes('smart momentum') ||
        strategy.strategy_name?.toLowerCase().includes('momentum')
      ) || [];
      
      console.log('Smart momentum strategies found:', smartMomentumStrategies);
      
      setSavedStrategies(data || []);
    } catch (error) {
      console.error('Failed to load saved strategies:', error);
      toast({
        title: "Failed to Load Strategies",
        description: "Could not load your saved strategies. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLoadStrategy = (strategySettings: StrategySettings) => {
    console.log('Loading strategy:', strategySettings);
    
    const completeStrategy: StrategySettings = {
      id: strategySettings.id,
      strategy_name: strategySettings.strategy_name,
      strategy_code: strategySettings.strategy_code,
      symbol: strategySettings.symbol,
      timeframe: strategySettings.timeframe,
      initial_balance: strategySettings.initial_balance || 10000,
      risk_per_trade: strategySettings.risk_per_trade || 1,
      stop_loss: strategySettings.stop_loss || 40,
      take_profit: strategySettings.take_profit || 80,
      spread: strategySettings.spread || 1.5,
      commission: strategySettings.commission || 0,
      slippage: strategySettings.slippage || 0.5,
      max_position_size: strategySettings.max_position_size || 100000,
      risk_model: strategySettings.risk_model || 'fixed',
      reverse_signals: strategySettings.reverse_signals || false,
      position_sizing_mode: strategySettings.position_sizing_mode || 'manual',
      risk_reward_ratio: strategySettings.risk_reward_ratio || 2,
      win_rate: strategySettings.win_rate,
      total_trades: strategySettings.total_trades,
      total_return: strategySettings.total_return,
      profit_factor: strategySettings.profit_factor,
      max_drawdown: strategySettings.max_drawdown
    };

    setSelectedStrategy(completeStrategy);
    localStorage.setItem('selected_strategy_settings', JSON.stringify(completeStrategy));
    
    // Also save to user settings in Supabase for cross-session persistence
    saveStrategyToUserSettings(completeStrategy);
    
    console.log('Strategy loaded and saved to localStorage:', completeStrategy);
    
    toast({
      title: "Strategy Settings Loaded",
      description: `Loaded strategy: ${completeStrategy.strategy_name} with all settings`,
    });
  };

  const saveStrategyToUserSettings = async (strategy: StrategySettings) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save selected strategy ID to a user settings approach
      localStorage.setItem('last_selected_strategy_id', strategy.id);
      console.log('💾 Saved strategy selection for cross-session persistence');
    } catch (error) {
      console.error('Failed to save strategy to user settings:', error);
    }
  };

  const loadLastSelectedStrategy = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const lastStrategyId = localStorage.getItem('last_selected_strategy_id');
      if (!lastStrategyId) return;

      // Find the strategy by ID from loaded strategies
      const strategy = savedStrategies.find(s => s.id === lastStrategyId);
      if (strategy) {
        setSelectedStrategy(strategy);
        localStorage.setItem('selected_strategy_settings', JSON.stringify(strategy));
        console.log('🔄 Restored last selected strategy after login');
      }
    } catch (error) {
      console.error('Failed to load last selected strategy:', error);
    }
  };

  const handleDeleteStrategy = async (strategyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('strategy_results')
        .delete()
        .eq('id', strategyId)
        .eq('user_id', user.id);

      if (error) throw error;

      // If the deleted strategy was selected, clear the selection
      if (selectedStrategy?.id === strategyId) {
        setSelectedStrategy(null);
        localStorage.removeItem('selected_strategy_settings');
        localStorage.removeItem('last_selected_strategy_id');
      }

      toast({
        title: "Strategy Deleted",
        description: "The strategy has been successfully deleted",
      });

      // Reload the strategies list
      loadSavedStrategies();

    } catch (error) {
      console.error('Delete strategy error:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete strategy",
        variant: "destructive",
      });
    }
  };

  return {
    savedStrategies,
    selectedStrategy,
    loadSelectedStrategy,
    loadSavedStrategies,
    loadLastSelectedStrategy,
    handleLoadStrategy,
    handleDeleteStrategy
  };
};
