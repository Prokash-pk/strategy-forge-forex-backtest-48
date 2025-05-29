
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw } from 'lucide-react';

interface StrategyCodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  codeChanged: boolean;
}

const StrategyCodeEditor: React.FC<StrategyCodeEditorProps> = ({ 
  code, 
  onCodeChange, 
  codeChanged 
}) => {
  return (
    <div>
      <Label htmlFor="strategyCode" className="text-slate-300">Python Strategy Code</Label>
      <Textarea
        id="strategyCode"
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        className="bg-slate-700 border-slate-600 text-white font-mono text-sm min-h-[300px] mt-2"
        placeholder="def strategy_logic(data):&#10;    # Your strategy logic here&#10;    return {'entry': [], 'exit': []}"
      />
      {codeChanged && (
        <p className="text-orange-400 text-xs mt-1 flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          Code modified - run backtest to see changes
        </p>
      )}
    </div>
  );
};

export default StrategyCodeEditor;
