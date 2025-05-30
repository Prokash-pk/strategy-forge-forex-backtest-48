
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

const GuideHeader = () => {
  return (
    <>
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button
          asChild
          variant="secondary"
        >
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <Button
          asChild
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Link to="/">
            <Home className="h-4 w-4 mr-2" />
            Go to Trading Platform
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">How Stratyx Works</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Learn how to build, test, and optimize profitable forex trading strategies with our professional backtesting platform
        </p>
      </div>
    </>
  );
};

export default GuideHeader;
