import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Settings, Code, Languages, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import StrategyTranslator from './StrategyTranslator';

interface StrategyConfigurationProps {
  strategy: {
    name: string;
    symbol: string;
    timeframe: string;
    code: string;
  };
  onStrategyChange: (updates: any) => void;
}

const StrategyConfiguration: React.FC<StrategyConfigurationProps> = ({ strategy, onStrategyChange }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('visual');
  const [isSaving, setIsSaving] = React.useState(false);

  const symbols = [
    { value: 'EURUSD=X', label: 'EUR/USD' },
    { value: 'GBPUSD=X', label: 'GBP/USD' },
    { value: 'USDJPY=X', label: 'USD/JPY' },
    { value: 'AUDUSD=X', label: 'AUD/USD' },
    { value: 'USDCAD=X', label: 'USD/CAD' },
    { value: 'USDCHF=X', label: 'USD/CHF' },
    { value: 'NZDUSD=X', label: 'NZD/USD' },
    { value: 'EURGBP=X', label: 'EUR/GBP' },
  ];

  const timeframes = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '1d', label: '1 Day' },
  ];

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

  const handleStrategyGenerated = (code: string) => {
    onStrategyChange({ code });
  };

  const handleSwitchToCode = () => {
    setActiveTab('python');
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Settings className="h-5 w-5" />
          Strategy Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-slate-700">
            <TabsTrigger value="visual">
              <Settings className="h-4 w-4 mr-2" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="english">
              <Languages className="h-4 w-4 mr-2" />
              English
            </TabsTrigger>
            <TabsTrigger value="python">
              <Code className="h-4 w-4 mr-2" />
              Python
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="strategyName" className="text-slate-300">Strategy Name</Label>
                <Input
                  id="strategyName"
                  value={strategy.name}
                  onChange={(e) => onStrategyChange({name: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="My Trading Strategy"
                />
              </div>
              <div>
                <Label htmlFor="symbol" className="text-slate-300">Currency Pair</Label>
                <Select value={strategy.symbol} onValueChange={(value) => onStrategyChange({symbol: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {symbols.map((symbol) => (
                      <SelectItem key={symbol.value} value={symbol.value} className="text-white">
                        {symbol.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="timeframe" className="text-slate-300">Timeframe</Label>
              <Select value={strategy.timeframe} onValueChange={(value) => onStrategyChange({timeframe: value})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {timeframes.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value} className="text-white">
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
              <p className="text-slate-300 text-sm">
                Visual strategy builder coming soon. For now, use the English or Python tabs to create your strategy.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="english" className="mt-6">
            <StrategyTranslator 
              onStrategyGenerated={handleStrategyGenerated}
              onSwitchToCode={handleSwitchToCode}
            />
          </TabsContent>

          <TabsContent value="python" className="space-y-4 mt-6">
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StrategyConfiguration;
