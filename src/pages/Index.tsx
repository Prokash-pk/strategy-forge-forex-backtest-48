
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StrategyBuilder from '@/components/StrategyBuilder';
import BacktestResults from '@/components/BacktestResults';
import DataManager from '@/components/DataManager';
import { TrendingUp, BarChart3, Database, Settings } from 'lucide-react';

const Index = () => {
  const [activeStrategy, setActiveStrategy] = useState(null);
  const [backtestResults, setBacktestResults] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Forex Strategy Lab</h1>
                <p className="text-slate-400 text-sm">Professional Backtesting Suite</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Market Data Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="builder" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
            <TabsTrigger value="builder" className="flex items-center gap-2 data-[state=active]:bg-emerald-600">
              <Settings className="h-4 w-4" />
              Strategy Builder
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2 data-[state=active]:bg-emerald-600">
              <Database className="h-4 w-4" />
              Data Manager
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2 data-[state=active]:bg-emerald-600">
              <BarChart3 className="h-4 w-4" />
              Backtest Results
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-emerald-600">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            <StrategyBuilder 
              onStrategyUpdate={setActiveStrategy}
              onBacktestComplete={setBacktestResults}
            />
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <DataManager />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <BacktestResults results={backtestResults} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700 p-8">
              <div className="text-center text-slate-400">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                <p>Coming soon - Walk-forward analysis, Monte Carlo simulation, and more</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
