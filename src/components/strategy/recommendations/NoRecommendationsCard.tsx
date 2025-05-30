
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const NoRecommendationsCard: React.FC = () => {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Great Strategy!</h3>
        <p className="text-slate-400">
          No immediate improvements detected. Run a backtest to get performance-based recommendations.
        </p>
      </CardContent>
    </Card>
  );
};

export default NoRecommendationsCard;
