
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, PlusCircle } from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium';
  impact: string;
  implementation: string;
  action?: () => void;
  codeSnippet?: string;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAddCode: (codeSnippet: string) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, onAddCode }) => {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-white text-lg">{recommendation.title}</CardTitle>
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
              {recommendation.priority === 'high' ? 'High Priority' : 'Medium Priority'}
            </Badge>
            <Badge variant="outline" className="text-slate-300">
              {recommendation.impact} Impact
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-slate-300">{recommendation.description}</p>
        
        <div className="bg-slate-700/50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-2">Implementation:</h4>
          <p className="text-sm text-slate-300">{recommendation.implementation}</p>
        </div>

        {recommendation.codeSnippet && (
          <div className="bg-slate-900 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">Code Enhancement:</h4>
            <pre className="text-xs text-slate-300 overflow-x-auto">
              {recommendation.codeSnippet}
            </pre>
          </div>
        )}

        <div className="flex gap-2">
          {recommendation.action && (
            <Button 
              onClick={recommendation.action}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Apply Fix
            </Button>
          )}
          {recommendation.codeSnippet && (
            <Button 
              onClick={() => onAddCode(recommendation.codeSnippet!)}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add to Strategy
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationCard;
