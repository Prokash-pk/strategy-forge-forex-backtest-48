
import React from 'react';
import { Settings } from 'lucide-react';

const EmptyStateDisplay: React.FC = () => {
  return (
    <div className="text-center py-6 text-slate-400">
      <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p>No saved OANDA accounts yet</p>
      <p className="text-sm">Add your first account configuration above</p>
    </div>
  );
};

export default EmptyStateDisplay;
