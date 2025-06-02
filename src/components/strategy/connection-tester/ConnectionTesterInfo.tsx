
import React from 'react';

const ConnectionTesterInfo: React.FC = () => {
  return (
    <div className="text-xs text-slate-500 mt-4">
      <p>💡 This test verifies your OANDA credentials and displays live account data.</p>
      <p>If the balance shows 0, check:</p>
      <ul className="list-disc list-inside mt-1 space-y-1">
        <li>You're using the correct environment (practice vs live)</li>
        <li>Your API key has the correct permissions</li>
        <li>Your account ID matches your OANDA account</li>
      </ul>
    </div>
  );
};

export default ConnectionTesterInfo;
