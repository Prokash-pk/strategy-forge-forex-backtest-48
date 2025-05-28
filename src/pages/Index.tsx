
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StrategyBuilder from '@/components/StrategyBuilder';
import BacktestResults from '@/components/BacktestResults';
import DataManager from '@/components/DataManager';
import UserMenu from '@/components/UserMenu';

const Index = () => {
  const [activeTab, setActiveTab] = useState('strategy');
  const [strategy, setStrategy] = useState(null);
  const [backtestResults, setBacktestResults] = useState(null);

  const handleStrategyUpdate = (updatedStrategy: any) => {
    setStrategy(updatedStrategy);
  };

  const handleBacktestComplete = (results: any) => {
    setBacktestResults(results);
  };

  const handleNavigateToResults = () => {
    setActiveTab('results');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Quantitative Trading Platform
            </h1>
            <p className="text-slate-400 mt-2">
              Build, backtest, and optimize your trading strategies with advanced analytics
            </p>
          </div>
          <UserMenu />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="strategy">Strategy Builder</TabsTrigger>
            <TabsTrigger value="results">Backtest Results</TabsTrigger>
            <TabsTrigger value="data">Data Manager</TabsTrigger>
          </TabsList>

          <TabsContent value="strategy">
            <StrategyBuilder
              onStrategyUpdate={handleStrategyUpdate}
              onBacktestComplete={handleBacktestComplete}
              onNavigateToResults={handleNavigateToResults}
              initialStrategy={strategy}
              backtestResults={backtestResults}
            />
          </TabsContent>

          <TabsContent value="results">
            <BacktestResults results={backtestResults} />
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
