
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface StrategyZeroTradesAlertProps {
  show: boolean;
}

const StrategyZeroTradesAlert: React.FC<StrategyZeroTradesAlertProps> = ({ show }) => {
  if (!show) return null;

  return (
    <Alert className="border-orange-600 bg-orange-600/10">
      <AlertTriangle className="h-4 w-4 text-orange-400" />
      <AlertDescription className="text-orange-300">
        <strong>No trades generated!</strong> Your strategy might have too restrictive conditions. 
        Try loading a proven strategy below or adjust your entry/exit criteria.
      </AlertDescription>
    </Alert>
  );
};

export default StrategyZeroTradesAlert;
