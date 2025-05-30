
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Code, 
  BarChart3, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Eye,
  Zap,
  Target,
  DollarSign
} from 'lucide-react';

interface GuideStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
  tips?: string[];
}

const HowItWorksGuide = () => {
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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">How Stratyx Works</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Learn how to build, test, and optimize profitable forex trading strategies with our professional backtesting platform
        </p>
      </div>

      {/* Key Features */}
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

      {/* Step-by-Step Guide */}
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

      {/* Quick Start */}
      <Card className="bg-gradient-to-r from-emerald-900/50 to-slate-800 border-emerald-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Play className="h-5 w-5" />
            Ready to Get Started?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300 mb-4">
            Jump right in with a proven strategy template and start backtesting in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Code className="h-4 w-4 mr-2" />
              Start with Python Strategy
            </Button>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <Eye className="h-4 w-4 mr-2" />
              Try Visual Builder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Expectations */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">What to Expect</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">60%+</div>
              <div className="text-sm text-slate-400">Average Win Rate</div>
              <div className="text-xs text-slate-500 mt-1">For well-optimized strategies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">1.5+</div>
              <div className="text-sm text-slate-400">Profit Factor</div>
              <div className="text-xs text-slate-500 mt-1">Profitable strategy threshold</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">&lt;15%</div>
              <div className="text-sm text-slate-400">Max Drawdown</div>
              <div className="text-xs text-slate-500 mt-1">Risk-managed strategies</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HowItWorksGuide;
