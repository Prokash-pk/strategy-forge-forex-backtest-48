
import React from 'react';
import { Label } from '@/components/ui/label';

interface VisualStrategyTabProps {
  strategy: any;
  onStrategyChange: (updates: any) => void;
  onAddToStrategy: (codeSnippet: string) => void;
}

const VisualStrategyTab: React.FC<VisualStrategyTabProps> = ({
  strategy,
  onStrategyChange,
  onAddToStrategy
}) => {
  return (
    <div className="space-y-4 mt-6">
      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
        <p className="text-slate-300 text-sm">
          Visual strategy builder coming soon. For now, use the English or Python tabs to create your strategy.
        </p>
      </div>
    </div>
  );
};

export default VisualStrategyTab;
