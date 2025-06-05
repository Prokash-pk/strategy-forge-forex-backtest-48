
import React from 'react';
import ComprehensiveDiagnostics from '../ComprehensiveDiagnostics';
import TradingDiagnostics from '../TradingDiagnostics';

interface TradingDiagnosticsTabProps {
  strategy: any;
}

const TradingDiagnosticsTab: React.FC<TradingDiagnosticsTabProps> = ({ strategy }) => {
  return (
    <div className="space-y-6">
      <ComprehensiveDiagnostics />
      <TradingDiagnostics strategy={strategy} />
    </div>
  );
};

export default TradingDiagnosticsTab;
