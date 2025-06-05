
import React from 'react';

interface AutoTesterConfigWarningProps {
  isConfigured: boolean;
}

const AutoTesterConfigWarning: React.FC<AutoTesterConfigWarningProps> = ({ isConfigured }) => {
  if (isConfigured) return null;

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
      <p className="text-yellow-300 text-sm">
        ⚠️ Strategy and OANDA configuration required before testing
      </p>
    </div>
  );
};

export default AutoTesterConfigWarning;
