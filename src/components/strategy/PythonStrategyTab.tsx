
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PythonStrategyTabProps {
  strategy: {
    name: string;
    symbol: string;
    timeframe: string;
    code: string;
  };
  onStrategyChange: (updates: any) => void;
}

const PythonStrategyTab: React.FC<PythonStrategyTabProps> = ({ strategy, onStrategyChange }) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

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
      const { data, error } = await supabase
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
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Strategy Saved",
        description: `"${strategy.name}" has been saved successfully`,
      });

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
    <div className="space-y-4 mt-6">
      <div>
        <Label htmlFor="strategyCode" className="text-slate-300">Python Strategy Code</Label>
        <Textarea
          id="strategyCode"
          value={strategy.code}
          onChange={(e) => onStrategyChange({code: e.target.value})}
          className="bg-slate-700 border-slate-600 text-white font-mono text-sm min-h-[300px] mt-2"
          placeholder="def strategy_logic(data):&#10;    # Your strategy logic here&#10;    return {'entry': [], 'exit': []}"
        />
      </div>

      <Button
        onClick={handleSaveStrategy}
        disabled={isSaving}
        variant="outline"
        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
      >
        {isSaving ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full mr-2"></div>
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Strategy
          </>
        )}
      </Button>
    </div>
  );
};

export default PythonStrategyTab;
