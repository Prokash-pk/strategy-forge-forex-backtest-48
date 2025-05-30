
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PerformanceExpectations = () => {
  return (
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
  );
};

export default PerformanceExpectations;
