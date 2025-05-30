
import React from 'react';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';

interface InitialAnalysisViewProps {
  backtestResults?: any;
  isAnalyzing: boolean;
  onAnalyzeStrategy: () => void;
}

const InitialAnalysisView: React.FC<InitialAnalysisViewProps> = ({
  backtestResults,
  isAnalyzing,
  onAnalyzeStrategy
}) => {
  return (
    <div className="text-center space-y-4">
      <div className="bg-slate-700/50 p-6 rounded-lg">
        <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">AI Strategy Analysis</h3>
        <p className="text-slate-300 mb-4">
          Let our AI analyze your strategy performance and automatically suggest improvements
        </p>
        
        {backtestResults && (
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="bg-slate-800 p-3 rounded">
              <div className="text-slate-400">Win Rate</div>
              <div className="text-white font-medium">{backtestResults.winRate?.toFixed(1)}%</div>
            </div>
            <div className="bg-slate-800 p-3 rounded">
              <div className="text-slate-400">Total Return</div>
              <div className="text-white font-medium">{backtestResults.totalReturn?.toFixed(1)}%</div>
            </div>
          </div>
        )}
      </div>
      
      <Button
        onClick={onAnalyzeStrategy}
        disabled={isAnalyzing || !backtestResults}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
      >
        {isAnalyzing ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            Analyzing Strategy...
          </>
        ) : (
          <>
            <Brain className="h-4 w-4 mr-2" />
            Analyze My Strategy
          </>
        )}
      </Button>
    </div>
  );
};

export default InitialAnalysisView;
