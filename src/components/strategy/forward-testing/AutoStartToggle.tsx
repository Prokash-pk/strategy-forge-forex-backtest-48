
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface AutoStartToggleProps {
  autoStartEnabled: boolean;
  onToggle: () => void;
}

export const AutoStartToggle: React.FC<AutoStartToggleProps> = ({
  autoStartEnabled,
  onToggle
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
      <div>
        <h4 className="text-white text-sm font-medium">Auto-Start Trading</h4>
        <p className="text-slate-400 text-xs">Automatically start when strategy and OANDA are ready</p>
      </div>
      <Button
        variant={autoStartEnabled ? "default" : "outline"}
        size="sm"
        onClick={onToggle}
        className={autoStartEnabled ? "bg-emerald-600 hover:bg-emerald-700" : ""}
      >
        <Settings className="h-3 w-3 mr-1" />
        {autoStartEnabled ? "ON" : "OFF"}
      </Button>
    </div>
  );
};
