
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface OANDAEnvironmentSelectorProps {
  environment: 'practice' | 'live';
  onEnvironmentChange: (value: 'practice' | 'live') => void;
}

const OANDAEnvironmentSelector: React.FC<OANDAEnvironmentSelectorProps> = ({
  environment,
  onEnvironmentChange
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="environment" className="text-slate-300">Environment</Label>
      <Select
        value={environment}
        onValueChange={onEnvironmentChange}
      >
        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-slate-700 border-slate-600">
          <SelectItem value="practice" className="text-white">
            <div className="flex items-center gap-2">
              <span>Practice (Demo)</span>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-xs">Recommended</Badge>
            </div>
          </SelectItem>
          <SelectItem value="live" className="text-white">
            <div className="flex items-center gap-2">
              <span>Live Trading</span>
              <Badge variant="secondary" className="bg-red-500/10 text-red-400 text-xs">Advanced</Badge>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      {environment === 'live' && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
          <p className="text-red-300 text-sm">
            Warning: Live trading involves real money. Only use this mode with thoroughly tested strategies.
          </p>
        </div>
      )}
    </div>
  );
};

export default OANDAEnvironmentSelector;
