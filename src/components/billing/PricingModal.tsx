
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ open, onOpenChange }) => {
  const { subscriptionTier, createCheckoutSession } = useSubscription();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      icon: <Star className="h-6 w-6" />,
      features: [
        '1 backtest run per month',
        'Limited backtesting (1 week)',
        'No strategy coach',
        'Basic support'
      ],
      cta: 'Current Plan',
      disabled: true,
      plan: 'free'
    },
    {
      name: 'Starter',
      price: '$9.99',
      period: '/month',
      icon: <Zap className="h-6 w-6" />,
      features: [
        '10 backtest runs per month',
        '1-month historical data',
        'Strategy Coach Lite',
        'Email-only support'
      ],
      cta: subscriptionTier === 'Starter' ? 'Current Plan' : 'Subscribe',
      disabled: subscriptionTier === 'Starter',
      plan: 'starter',
      popular: subscriptionTier === 'Free'
    },
    {
      name: 'Pro',
      price: '$19.99',
      period: '/month',
      icon: <Crown className="h-6 w-6" />,
      features: [
        'Unlimited backtest runs',
        '1-year historical data',
        'Full Strategy Coach',
        'Performance suggestions',
        'Priority support'
      ],
      cta: subscriptionTier === 'Pro' ? 'Current Plan' : 'Subscribe',
      disabled: subscriptionTier === 'Pro',
      plan: 'pro',
      popular: subscriptionTier === 'Starter'
    },
    {
      name: 'Lifetime',
      price: '$34.99',
      period: 'one-time',
      icon: <Crown className="h-6 w-6" />,
      features: [
        'All Pro features',
        'Lifetime access',
        'No monthly fees',
        'Future updates included'
      ],
      cta: subscriptionTier === 'Lifetime' ? 'Current Plan' : 'Buy Now',
      disabled: subscriptionTier === 'Lifetime',
      plan: 'lifetime',
      highlight: true
    }
  ];

  const handleSubscribe = async (plan: string) => {
    if (plan === 'free') return;
    await createCheckoutSession(plan);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-white">
            Choose Your Stratyx Plan
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative bg-slate-700 border-slate-600 ${
                plan.highlight ? 'ring-2 ring-emerald-500' : ''
              } ${plan.popular ? 'ring-1 ring-emerald-400' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-emerald-600">
                  Most Popular
                </Badge>
              )}
              {plan.highlight && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-yellow-600">
                  Best Value
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className="flex justify-center text-emerald-400 mb-2">
                  {plan.icon}
                </div>
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <div className="text-2xl font-bold text-white">
                  {plan.price}
                  <span className="text-sm font-normal text-slate-400">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleSubscribe(plan.plan)}
                  disabled={plan.disabled}
                  className={`w-full ${
                    plan.disabled 
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                      : plan.highlight
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;
