
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
          <div className="flex items-center gap-4">
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0idXJsKCNncmFkaWVudDApIi8+CjxwYXRoIGQ9Ik04IDIwSDI0TDE2IDEyTDggMjBaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNOCAxMkgyNEwxNiAyMEw4IDEyWiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNyIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDAiIHgxPSIwIiB5MT0iMCIgeDI9IjMyIiB5Mj0iMzIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzEwQjk4MSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwRDlDODgiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K" 
              alt="Stratyx Logo" 
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                Stratyx
              </h1>
              <p className="text-slate-400 mt-2">
                Professional forex strategy backtesting and analysis platform
              </p>
            </div>
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
