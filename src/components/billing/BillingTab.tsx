
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, Crown, Zap, Star } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

const BillingTab = () => {
  const { subscriptionTier, subscribed, subscriptionEnd, openCustomerPortal, refreshSubscription } = useSubscription();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Pro':
      case 'Lifetime':
        return <Crown className="h-5 w-5" />;
      case 'Starter':
        return <Zap className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Pro':
        return 'bg-purple-600';
      case 'Lifetime':
        return 'bg-yellow-600';
      case 'Starter':
        return 'bg-blue-600';
      default:
        return 'bg-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Billing & Subscription</h2>
        <p className="text-slate-400">Manage your Stratyx subscription and billing details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Plan */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-emerald-400">
                {getTierIcon(subscriptionTier)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-white">{subscriptionTier}</span>
                  <Badge className={getTierColor(subscriptionTier)}>
                    {subscribed ? 'Active' : 'Free'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400">
                  {subscriptionTier === 'Free' 
                    ? 'Limited features' 
                    : subscriptionTier === 'Lifetime'
                    ? 'Lifetime access'
                    : 'Monthly subscription'
                  }
                </p>
              </div>
            </div>

            {subscriptionEnd && subscriptionTier !== 'Lifetime' && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Calendar className="h-4 w-4" />
                <span>Renews on {formatDate(subscriptionEnd)}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={refreshSubscription}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Refresh Status
              </Button>
              
              {subscribed && subscriptionTier !== 'Lifetime' && (
                <Button
                  onClick={openCustomerPortal}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Manage Billing
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan Features */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Plan Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptionTier === 'Free' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Saved Strategies</span>
                    <span className="text-white">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Historical Data</span>
                    <span className="text-white">1 week</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Strategy Coach</span>
                    <span className="text-red-400">Not Available</span>
                  </div>
                </>
              )}
              
              {subscriptionTier === 'Starter' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Saved Strategies</span>
                    <span className="text-white">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Historical Data</span>
                    <span className="text-white">1 month</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Strategy Coach</span>
                    <span className="text-emerald-400">Lite Version</span>
                  </div>
                </>
              )}
              
              {(subscriptionTier === 'Pro' || subscriptionTier === 'Lifetime') && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Saved Strategies</span>
                    <span className="text-white">20</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Historical Data</span>
                    <span className="text-white">1 year</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Strategy Coach</span>
                    <span className="text-emerald-400">Full Version</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Support</span>
                    <span className="text-emerald-400">Priority</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingTab;
