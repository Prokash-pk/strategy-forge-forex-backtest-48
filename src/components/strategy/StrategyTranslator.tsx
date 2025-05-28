
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Lightbulb, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StrategyTranslatorProps {
  onStrategyGenerated: (code: string) => void;
  onSwitchToCode: () => void;
}

const StrategyTranslator: React.FC<StrategyTranslatorProps> = ({ 
  onStrategyGenerated, 
  onSwitchToCode 
}) => {
  const [englishInput, setEnglishInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const exampleStrategies = [
    "Buy when price touches the lower Bollinger Band and sell when it touches the upper Bollinger Band",
    "Enter long when RSI is below 30 and exit when RSI is above 70",
    "Buy when the 12-period EMA crosses above the 26-period EMA, sell when it crosses below",
    "Enter trades when price breaks above the 20-period moving average with volume confirmation"
  ];

  const handleGenerateStrategy = async () => {
    if (!englishInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe your trading strategy in English",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('translate-strategy', {
        body: { natural_language: englishInput }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate strategy');
      }

      // Pass the generated code to parent component
      onStrategyGenerated(data.python_code);
      
      // Switch to Python tab
      onSwitchToCode();
      
      toast({
        title: "Strategy Generated!",
        description: "Your English description has been converted to Python code",
      });

    } catch (error) {
      console.error('Strategy generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate strategy",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setEnglishInput(example);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Lightbulb className="h-5 w-5" />
            Describe Your Strategy in English
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="strategy-description" className="text-slate-300">
              Trading Strategy Description
            </Label>
            <Textarea
              id="strategy-description"
              placeholder="Describe your trading strategy in plain English. For example: 'Buy when price touches the lower Bollinger Band and sell when it touches the upper Bollinger Band'"
              value={englishInput}
              onChange={(e) => setEnglishInput(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white min-h-[120px] mt-2"
              rows={6}
            />
          </div>

          <Button
            onClick={handleGenerateStrategy}
            disabled={isGenerating || !englishInput.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Generating Strategy...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Python Strategy
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Example Strategies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {exampleStrategies.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              className="w-full text-left p-3 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors"
            >
              {example}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default StrategyTranslator;
