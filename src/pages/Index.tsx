
import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, CreditCard, MessageSquare, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import StrategyBuilder from '@/components/StrategyBuilder';
import BacktestResults from '@/components/BacktestResults';
import DataManager from '@/components/DataManager';
import UserMenu from '@/components/UserMenu';
import PricingModal from '@/components/billing/PricingModal';
import BillingTab from '@/components/billing/BillingTab';
import SupportTab from '@/components/support/SupportTab';
import UserTestingAnalytics from '@/components/analytics/UserTestingAnalytics';
import { useSubscription } from '@/hooks/useSubscription';

const Index = () => {
  const [activeTab, setActiveTab] = useState('strategy');
  const [strategy, setStrategy] = useState(null);
  const [backtestResults, setBacktestResults] = useState(null);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  
  const { subscriptionTier, subscribed } = useSubscription();

  const handleStrategyUpdate = useCallback((updatedStrategy: any) => {
    setStrategy(updatedStrategy);
  }, []);

  const handleBacktestComplete = useCallback((results: any) => {
    setBacktestResults(results);
  }, []);

  const handleNavigateToResults = useCallback(() => {
    setActiveTab('results');
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const showUpgradePrompt = subscriptionTier === 'Free' || subscriptionTier === 'Starter';

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
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                  Stratyx
                </h1>
                <Badge 
                  className={`${
                    subscriptionTier === 'Free' ? 'bg-slate-600' :
                    subscriptionTier === 'Starter' ? 'bg-blue-600' :
                    subscriptionTier === 'Pro' ? 'bg-purple-600' :
                    'bg-yellow-600'
                  }`}
                >
                  {subscriptionTier}
                </Badge>
                {showUpgradePrompt && (
                  <Button
                    onClick={() => setPricingModalOpen(true)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Upgrade
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Link to="/guide">
                    <BookOpen className="h-4 w-4 mr-1" />
                    Guide
                  </Link>
                </Button>
              </div>
              <p className="text-slate-400 mt-2">
                Professional forex strategy backtesting and analysis platform
              </p>
            </div>
          </div>
          <UserMenu />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-slate-800">
            <TabsTrigger value="strategy">Strategy Builder</TabsTrigger>
            <TabsTrigger value="results">Backtest Results</TabsTrigger>
            <TabsTrigger value="data">Data Manager</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="h-4 w-4 mr-1" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="support">
              <MessageSquare className="h-4 w-4 mr-1" />
              Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="strategy" className="focus:outline-none">
            <StrategyBuilder
              onStrategyUpdate={handleStrategyUpdate}
              onBacktestComplete={handleBacktestComplete}
              onNavigateToResults={handleNavigateToResults}
              initialStrategy={strategy}
              backtestResults={backtestResults}
            />
          </TabsContent>

          <TabsContent value="results" className="focus:outline-none">
            <BacktestResults results={backtestResults} />
          </TabsContent>

          <TabsContent value="data" className="focus:outline-none">
            <DataManager />
          </TabsContent>

          <TabsContent value="analytics" className="focus:outline-none">
            <UserTestingAnalytics />
          </TabsContent>

          <TabsContent value="billing" className="focus:outline-none">
            <BillingTab />
          </TabsContent>

          <TabsContent value="support" className="focus:outline-none">
            <SupportTab />
          </TabsContent>
        </Tabs>
      </div>

      <PricingModal open={pricingModalOpen} onOpenChange={setPricingModalOpen} />
    </div>
  );
};

export default Index;
