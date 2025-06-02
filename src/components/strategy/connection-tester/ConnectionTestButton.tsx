
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Wifi } from 'lucide-react';

interface ConnectionTestButtonProps {
  onTest: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

const ConnectionTestButton: React.FC<ConnectionTestButtonProps> = ({
  onTest,
  isLoading,
  isDisabled
}) => {
  return (
    <Button
      onClick={onTest}
      disabled={isLoading || isDisabled}
      className="bg-blue-600 hover:bg-blue-700"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Testing Connection...
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4 mr-2" />
          Test Live Connection
        </>
      )}
    </Button>
  );
};

export default ConnectionTestButton;
