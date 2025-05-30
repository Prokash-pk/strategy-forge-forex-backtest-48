
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Target, Eye, DollarSign } from 'lucide-react';

const KeyFeatures = () => {
  const keyFeatures = [
    {
      icon: <Zap className="h-5 w-5 text-yellow-400" />,
      title: "Real-Time Execution",
      description: "Enhanced Python execution with dynamic spreads and realistic slippage modeling"
    },
    {
      icon: <Target className="h-5 w-5 text-emerald-400" />,
      title: "Advanced Analytics",
      description: "Comprehensive performance metrics including Sharpe ratio, maximum drawdown, and more"
    },
    {
      icon: <Eye className="h-5 w-5 text-blue-400" />,
      title: "Visual Strategy Builder",
      description: "Create strategies without coding using drag-and-drop components"
    },
    {
      icon: <DollarSign className="h-5 w-5 text-green-400" />,
      title: "Risk-Adjusted Returns",
      description: "Focus on sustainable, risk-managed trading strategies"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {keyFeatures.map((feature, index) => (
        <Card key={index} className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {feature.icon}
              <div>
                <h3 className="text-white font-medium text-sm">{feature.title}</h3>
                <p className="text-slate-400 text-xs mt-1">{feature.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KeyFeatures;
