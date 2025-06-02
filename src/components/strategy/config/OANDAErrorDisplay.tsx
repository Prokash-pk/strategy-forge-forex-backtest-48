
import React from 'react';

interface OANDAErrorDisplayProps {
  connectionError: string;
}

const OANDAErrorDisplay: React.FC<OANDAErrorDisplayProps> = ({
  connectionError
}) => {
  if (!connectionError) {
    return null;
  }

  return (
    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
      <p className="text-red-300 text-sm">{connectionError}</p>
    </div>
  );
};

export default OANDAErrorDisplay;
