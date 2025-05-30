
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, Target, TrendingUp, Brain, Plus, Copy } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: any;
  isApplied: boolean;
  isApplying: boolean;
  onQuickAdd: (rec: any) => void;
  onCopyToClipboard: (text: string, title: string) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  isApplied,
  isApplying,
  onQuickAdd,
  onCopyToClipboard
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'risk_management': return Shield;
      case 'entry_timing': return Clock;
      case 'exit_strategy': return Target;
      case 'position_sizing': return TrendingUp;
      default: return Brain;
    }
  };

  const IconComponent = getCategoryIcon(recommendation.category);

  return (
    <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <IconComponent className="h-4 w-4 text-blue-400" />
          <h4 className="font-medium text-white">{recommendation.title}</h4>
        </div>
        <div className="flex gap-2">
          <Badge 
            variant="secondary" 
            className={`${
              recommendation.priority === 'high' 
                ? 'bg-red-500/10 text-red-400' 
                : 'bg-yellow-500/10 text-yellow-400'
            }`}
          >
            {recommendation.priority}
          </Badge>
          <Badge variant="outline" className="text-slate-300">
            +{recommendation.estimatedImprovement}%
          </Badge>
          {isApplied && (
            <Badge className="bg-green-500/10 text-green-400">
              Applied
            </Badge>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-300 mb-2">{recommendation.description}</p>
      <p className="text-xs text-slate-400 mb-3">{recommendation.reasoning}</p>
      
      {recommendation.codeSnippet && (
        <div className="mt-3 bg-slate-800 p-3 rounded text-xs text-slate-300 font-mono border border-slate-600 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-slate-400">Enhancement Preview:</div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopyToClipboard(recommendation.codeSnippet!, recommendation.title)}
              className="h-6 px-2 border-slate-500 text-slate-400 hover:bg-slate-700"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
          <div className="text-slate-300 whitespace-pre-wrap max-h-24 overflow-y-auto">
            {recommendation.codeSnippet}
          </div>
        </div>
      )}

      {recommendation.codeSnippet && (
        <div className="flex gap-2">
          <Button
            onClick={() => onQuickAdd(recommendation)}
            disabled={isApplied || isApplying}
            className={`${
              isApplied 
                ? 'bg-green-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
            size="sm"
          >
            {isApplying ? (
              <>
                <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Applying...
              </>
            ) : isApplied ? (
              <>
                <Target className="h-3 w-3 mr-2" />
                Applied
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 mr-2" />
                Quick Add
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;
