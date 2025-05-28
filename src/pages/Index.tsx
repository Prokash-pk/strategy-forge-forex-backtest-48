
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StrategyBuilder from '@/components/StrategyBuilder';
import BacktestResults from '@/components/BacktestResults';
import DataManager from '@/components/DataManager';
import { StrategyCodeInsertion } from '@/services/strategyCodeInsertion';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('builder');
  const [strategy, setStrategy] = useState(null);
  const { toast } = useToast();

  const handleStrategyUpdate = (strategyData: any) => {
    console.log('Strategy updated:', strategyData);
    setStrategy(strategyData);
  };

  const handleBacktestComplete = (backtestResults: any) => {
    console.log('Backtest completed:', backtestResults);
    setResults(backtestResults);
  };

  const handleNavigateToResults = () => {
    setActiveTab('results');
  };

  const handleAddToStrategy = (codeSnippet: string) => {
    if (!strategy) {
      toast({
        title: "No Strategy Found",
        description: "Please create a strategy first in the Strategy Builder",
        variant: "destructive",
      });
      return;
    }

    const updatedCode = StrategyCodeInsertion.insertCodeSnippet(
      strategy.code || '', 
      codeSnippet, 
      'Strategy Coach Suggestion'
    );

    const updatedStrategy = { ...strategy, code: updatedCode };
    setStrategy(updatedStrategy);
    
    // Switch to builder tab to show the updated code
    setActiveTab('builder');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Enhanced Forex Strategy Backtester
          </h1>
          <p className="text-slate-300 text-lg">
            Build, test, and optimize forex trading strategies with real market data and enhanced execution modeling
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700">
            <TabsTrigger value="builder" className="data-[state=active]:bg-emerald-600">
              Strategy Builder
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-emerald-600">
              Backtest Results
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-emerald-600">
              Data Manager
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder">
            <StrategyBuilder 
              onStrategyUpdate={handleStrategyUpdate}
              onBacktestComplete={handleBacktestComplete}
              onNavigateToResults={handleNavigateToResults}
              initialStrategy={strategy}
            />
          </TabsContent>

          <TabsContent value="results">
            <BacktestResults 
              results={results} 
              onAddToStrategy={handleAddToStrategy}
            />
          </TabsContent>

          <TabsContent value="data">
            <DataManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
