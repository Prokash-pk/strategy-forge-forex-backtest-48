
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatisticsCardsProps {
  results: any;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({ results }) => {
  const winningTrades = results.winningTrades || 0;
  const losingTrades = results.losingTrades || 0;
  const avgWin = results.avgWin || results.averageWin || 0;
  const avgLoss = results.avgLoss || results.averageLoss || 0;
  const profitFactor = results.profitFactor || 1;
  const sharpeRatio = results.sharpeRatio || 0;
  const maxDrawdown = results.maxDrawdown || 0;
  const winRate = results.winRate || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Trade Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-slate-400">Winning Trades</span>
            <span className="text-emerald-400 font-semibold">{winningTrades}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Losing Trades</span>
            <span className="text-red-400 font-semibold">{losingTrades}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Average Win</span>
            <span className="text-emerald-400 font-semibold">${avgWin.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Average Loss</span>
            <span className="text-red-400 font-semibold">${Math.abs(avgLoss).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Risk Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-slate-400">Profit Factor</span>
            <span className="text-white font-semibold">{profitFactor.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Sharpe Ratio</span>
            <span className="text-white font-semibold">{sharpeRatio.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Max Drawdown</span>
            <span className="text-orange-400 font-semibold">{maxDrawdown.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Win Rate</span>
            <span className="text-blue-400 font-semibold">{winRate.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsCards;
