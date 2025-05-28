
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StrategyBuilder from '@/components/StrategyBuilder';
import BacktestResults from '@/components/BacktestResults';
import DataManager from '@/components/DataManager';

const Index = () => {
  const [activeTab, setActiveTab] = useState('strategy');
  const [strategy, setStrategy] = useState(null);
  const [backtestResults, setBacktestResults] = useState(null);
  const { user, signOut } = useAuth();

  const handleStrategyUpdate = (updatedStrategy: any) => {
    setStrategy(updatedStrategy);
  };

  const handleBacktestComplete = (results: any) => {
    setBacktestResults(results);
  };

  const handleNavigateToResults = () => {
    setActiveTab('results');
  };

  const handleSignOut = async () => {
    await signOut();
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <User className="h-4 w-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
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
              backtestResults={null}
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
