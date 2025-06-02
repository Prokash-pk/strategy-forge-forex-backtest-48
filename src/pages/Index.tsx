
import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, CreditCard, MessageSquare, BookOpen, Settings, BarChart3, Database, TrendingUp, User } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const [activeTab, setActiveTab] = useState('strategy');
  const [strategy, setStrategy] = useState(null);
  const [backtestResults, setBacktestResults] = useState(null);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const isMobile = useIsMobile();
  
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

  const tabItems = [
    { id: 'strategy', label: 'Strategy', icon: Settings, shortLabel: 'Strategy' },
    { id: 'results', label: 'Results', icon: BarChart3, shortLabel: 'Results' },
    { id: 'data', label: 'Data', icon: Database, shortLabel: 'Data' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, shortLabel: 'Analytics' },
    { id: 'billing', label: 'Billing', icon: CreditCard, shortLabel: 'Billing' },
    { id: 'support', label: 'Support', icon: MessageSquare, shortLabel: 'Support' },
  ];

  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-900 text-white pb-20">
        <div className="container mx-auto px-4 py-4">
          {/* Mobile Header */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img 
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0idXJsKCNncmFkaWVudDApIi8+CjxwYXRoIGQ9Ik04IDIwSDI0TDE2IDEyTDggMjBaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNOCAxMkgyNEwxNiAyMEw4IDEyWiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNyIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDAiIHgxPSIwIiB5MT0iMCIgeDI9IjMyIiB5Mj0iMzIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzEwQjk4MSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwRDlDODgiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K" 
                alt="Stratyx Logo" 
                className="h-8 w-8"
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                  Stratyx
                </h1>
                <Badge 
                  className={`text-xs ${
                    subscriptionTier === 'Free' ? 'bg-slate-600' :
                    subscriptionTier === 'Starter' ? 'bg-blue-600' :
                    subscriptionTier === 'Pro' ? 'bg-purple-600' :
                    'bg-yellow-600'
                  }`}
                >
                  {subscriptionTier}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showUpgradePrompt && (
                <Button
                  onClick={() => setPricingModalOpen(true)}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Crown className="h-4 w-4" />
                </Button>
              )}
              <UserMenu />
            </div>
          </div>

          {/* Mobile Content */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="space-y-4">
              <TabsContent value="strategy" className="mt-0">
                <StrategyBuilder
                  onStrategyUpdate={handleStrategyUpdate}
                  onBacktestComplete={handleBacktestComplete}
                  onNavigateToResults={handleNavigateToResults}
                  initialStrategy={strategy}
                  backtestResults={backtestResults}
                />
              </TabsContent>

              <TabsContent value="results" className="mt-0">
                <BacktestResults results={backtestResults} />
              </TabsContent>

              <TabsContent value="data" className="mt-0">
                <DataManager />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <UserTestingAnalytics />
              </TabsContent>

              <TabsContent value="billing" className="mt-0">
                <BillingTab />
              </TabsContent>

              <TabsContent value="support" className="mt-0">
                <SupportTab />
              </TabsContent>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-2 py-2 z-50">
              <TabsList className="grid grid-cols-6 w-full h-14 bg-transparent p-0 space-x-1">
                {tabItems.map((item) => (
                  <TabsTrigger
                    key={item.id}
                    value={item.id}
                    className="flex flex-col items-center justify-center h-full px-1 py-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg"
                  >
                    <item.icon className="h-4 w-4 mb-1" />
                    <span className="text-xs">{item.shortLabel}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        </div>

        <PricingModal open={pricingModalOpen} onOpenChange={setPricingModalOpen} />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Desktop Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0idXJsKCNncmFkaWVudDApIi8+CjxwYXRoIGQ9Ik04IDIwSDI0TDE2IDEyTDggMjBaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNOCAxMkgyNEwxNiAyMEw4IDEyWiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNyIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDAiIHgxPSIwIiB5MT0iMCIgeDI9IjMyIiB5Mj0iMzIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzEwQjk4MSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwRDlDODgiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K" 
              alt="Stratyx Logo" 
              className="h-10 w-10"
            />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                Stratyx
              </h1>
              <Badge 
                className={`text-xs ${
                  subscriptionTier === 'Free' ? 'bg-slate-600' :
                  subscriptionTier === 'Starter' ? 'bg-blue-600' :
                  subscriptionTier === 'Pro' ? 'bg-purple-600' :
                  'bg-yellow-600'
                }`}
              >
                {subscriptionTier}
              </Badge>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
          <TabsList className="flex flex-col h-auto bg-transparent p-4 space-y-2">
            {tabItems.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="w-full justify-start gap-3 h-12 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-700 space-y-3">
            {showUpgradePrompt && (
              <Button
                onClick={() => setPricingModalOpen(true)}
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Link to="/guide">
                <BookOpen className="h-4 w-4 mr-2" />
                Guide
              </Link>
            </Button>
            <UserMenu />
          </div>
        </Tabs>
      </div>

      {/* Desktop Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <p className="text-slate-400">
            Professional forex strategy backtesting and analysis platform
          </p>
        </div>

        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsContent value="strategy" className="mt-0">
              <StrategyBuilder
                onStrategyUpdate={handleStrategyUpdate}
                onBacktestComplete={handleBacktestComplete}
                onNavigateToResults={handleNavigateToResults}
                initialStrategy={strategy}
                backtestResults={backtestResults}
              />
            </TabsContent>

            <TabsContent value="results" className="mt-0">
              <BacktestResults results={backtestResults} />
            </TabsContent>

            <TabsContent value="data" className="mt-0">
              <DataManager />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <UserTestingAnalytics />
            </TabsContent>

            <TabsContent value="billing" className="mt-0">
              <BillingTab />
            </TabsContent>

            <TabsContent value="support" className="mt-0">
              <SupportTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <PricingModal open={pricingModalOpen} onOpenChange={setPricingModalOpen} />
    </div>
  );
};

export default Index;
