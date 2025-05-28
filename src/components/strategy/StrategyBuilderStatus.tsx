
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Code } from 'lucide-react';

interface StrategyBuilderStatusProps {
  pythonStatus: 'checking' | 'available' | 'unavailable';
}

const StrategyBuilderStatus: React.FC<StrategyBuilderStatusProps> = ({ pythonStatus }) => {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Code className="h-5 w-5 text-slate-400" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">Enhanced Python Execution Engine</span>
              {pythonStatus === 'checking' && (
                <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
              )}
              {pythonStatus === 'available' && (
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              )}
              {pythonStatus === 'unavailable' && (
                <AlertCircle className="h-4 w-4 text-yellow-400" />
              )}
            </div>
            <p className="text-sm text-slate-400">
              {pythonStatus === 'checking' && 'Initializing enhanced Python runtime...'}
              {pythonStatus === 'available' && 'Ready - Enhanced accuracy with dynamic spreads, realistic slippage, and advanced position sizing'}
              {pythonStatus === 'unavailable' && 'Limited - Using pattern matching fallback with basic execution modeling'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StrategyBuilderStatus;
