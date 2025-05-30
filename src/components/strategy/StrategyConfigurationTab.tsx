import React from 'react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BasicSettings from './BasicSettings';
import RiskManagementSettings from './RiskManagementSettings';
import ExecutionSettingsForm from './ExecutionSettingsForm';
import StrategyCodeEditor from './StrategyCodeEditor';
import StrategyActionButtons from './StrategyActionButtons';

interface StrategyConfigurationTabProps {
  strategy: {
    name: string;
    symbol: string;
    timeframe: string;
    code: string;
    initialBalance: number;
    riskPerTrade: number;
    stopLoss: number;
    takeProfit: number;
    spread: number;
    commission: number;
    slippage: number;
    maxPositionSize: number;
    riskModel: string;
    positionSizingMode: string;
    riskRewardRatio: number;
  };
  onStrategyChange: (updates: any) => void;
  onRunBacktest?: () => void;
  isRunning?: boolean;
}

const StrategyConfigurationTab: React.FC<StrategyConfigurationTabProps> = ({ 
  strategy, 
  onStrategyChange,
  onRunBacktest,
  isRunning = false 
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [codeChanged, setCodeChanged] = React.useState(false);

  React.useEffect(() => {
    setCodeChanged(false);
  }, [strategy.code]);

  const handleCodeChange = (newCode: string) => {
    onStrategyChange({code: newCode});
    setCodeChanged(true);
  };

  const handleSaveStrategy = async () => {
    if (!strategy.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a strategy name",
        variant: "destructive",
      });
      return;
    }

    if (!strategy.code.trim()) {
      toast({
        title: "Code Required", 
        description: "Please enter strategy code",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('strategy_results')
        .insert([{
          strategy_name: strategy.name,
          strategy_code: strategy.code,
          symbol: strategy.symbol,
          timeframe: strategy.timeframe,
          win_rate: 0,
          total_return: 0,
          total_trades: 0,
          profit_factor: 0,
          max_drawdown: 0
        }]);

      if (error) {
        throw error;
      }

      toast({
        title: "Strategy Saved",
        description: `"${strategy.name}" has been saved successfully`,
      });

      setCodeChanged(false);

    } catch (error) {
      console.error('Save strategy error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save strategy",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <BasicSettings 
        strategy={strategy} 
        onStrategyChange={onStrategyChange} 
      />

      <Separator className="bg-slate-600" />

      <RiskManagementSettings 
        strategy={strategy} 
        onStrategyChange={onStrategyChange} 
      />

      <Separator className="bg-slate-600" />

      <ExecutionSettingsForm 
        strategy={strategy} 
        onStrategyChange={onStrategyChange} 
      />

      <Separator className="bg-slate-600" />

      <StrategyCodeEditor
        code={strategy.code}
        onCodeChange={handleCodeChange}
        codeChanged={codeChanged}
      />

      <StrategyActionButtons
        onRunBacktest={onRunBacktest}
        onSaveStrategy={handleSaveStrategy}
        isRunning={isRunning}
        isSaving={isSaving}
        codeChanged={codeChanged}
        hasCode={strategy.code.trim().length > 0}
      />
    </div>
  );
};

export default StrategyConfigurationTab;
