
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  BarChart3, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface GuideStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
  tips?: string[];
}

const GuideSteps = () => {
  const [activeStep, setActiveStep] = useState(1);

  const steps: GuideStep[] = [
    {
      id: 1,
      title: "Strategy Building",
      description: "Create or customize trading strategies using Python code or visual builder",
      icon: <Code className="h-6 w-6" />,
      details: [
        "Write Python strategies with technical indicators",
        "Use pre-built proven strategies as starting points", 
        "Configure entry and exit conditions",
        "Set up risk management parameters"
      ],
      tips: [
        "Start with proven strategies and modify them",
        "Keep entry conditions simple to avoid over-optimization",
        "Test one indicator at a time before combining"
      ]
    },
    {
      id: 2,
      title: "Risk Management",
      description: "Configure position sizing, stop losses, and take profits",
      icon: <Settings className="h-6 w-6" />,
      details: [
        "Set stop loss and take profit levels",
        "Configure position sizing (fixed or percentage-based)",
        "Adjust spread and commission settings",
        "Set maximum position size limits"
      ],
      tips: [
        "Never risk more than 1-2% per trade",
        "Use proper risk-reward ratios (1:2 minimum)",
        "Account for realistic spreads and commissions"
      ]
    },
    {
      id: 3,
      title: "Backtesting",
      description: "Test your strategy against historical market data",
      icon: <BarChart3 className="h-6 w-6" />,
      details: [
        "Run strategy against real forex data",
        "Get detailed performance metrics",
        "View trade-by-trade execution",
        "Analyze equity curve and drawdowns"
      ],
      tips: [
        "Test on at least 6 months of data",
        "Look for consistent performance across time periods",
        "Pay attention to maximum drawdown levels"
      ]
    },
    {
      id: 4,
      title: "Results Analysis",
      description: "Analyze performance metrics and optimize your strategy",
      icon: <TrendingUp className="h-6 w-6" />,
      details: [
        "Review win rate and profit factor",
        "Analyze monthly returns breakdown",
        "Study individual trade performance",
        "Get AI-powered strategy coaching"
      ],
      tips: [
        "Aim for profit factor > 1.3",
        "Look for consistent monthly performance",
        "Avoid strategies with too few trades"
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Steps Navigation */}
      <div className="lg:col-span-1">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Guide Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {steps.map((step) => (
              <Button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                variant={activeStep === step.id ? "default" : "ghost"}
                className={`w-full justify-start text-left h-auto p-3 ${
                  activeStep === step.id 
                    ? "bg-emerald-600 hover:bg-emerald-700" 
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 ${activeStep === step.id ? "text-white" : "text-slate-400"}`}>
                    {step.icon}
                  </div>
                  <div>
                    <div className="font-medium">{step.title}</div>
                    <div className="text-xs opacity-80">{step.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Step Details */}
      <div className="lg:col-span-2">
        {steps.map((step) => (
          <div key={step.id} className={activeStep === step.id ? "block" : "hidden"}>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className="bg-emerald-600">Step {step.id}</Badge>
                  <CardTitle className="text-white flex items-center gap-2">
                    {step.icon}
                    {step.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-slate-300">{step.description}</p>
                
                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    What You'll Do:
                  </h4>
                  <ul className="space-y-2">
                    {step.details.map((detail, index) => (
                      <li key={index} className="flex items-start gap-2 text-slate-300">
                        <ArrowRight className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {step.tips && (
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      Pro Tips:
                    </h4>
                    <ul className="space-y-2">
                      {step.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-slate-300">
                          <div className="h-1.5 w-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuideSteps;
