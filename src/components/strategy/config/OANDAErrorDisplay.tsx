
import React from 'react';
import { AlertTriangle, Key, ExternalLink } from 'lucide-react';

interface OANDAErrorDisplayProps {
  connectionError: string;
}

const OANDAErrorDisplay: React.FC<OANDAErrorDisplayProps> = ({
  connectionError
}) => {
  if (!connectionError) {
    return null;
  }

  const isTokenError = connectionError.includes('token') || connectionError.includes('401') || connectionError.includes('authorization');

  return (
    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <p className="text-red-300 text-sm whitespace-pre-line">{connectionError}</p>
          
          {isTokenError && (
            <div className="bg-red-500/20 p-3 rounded border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4 text-red-300" />
                <span className="text-sm font-medium text-red-200">Quick Fix: Generate New API Token</span>
              </div>
              <div className="space-y-2 text-xs text-red-200">
                <p>1. Visit OANDA and log into your account</p>
                <p>2. Navigate to "Manage API Access" or "API Settings"</p>
                <p>3. Generate a new Personal Access Token</p>
                <p>4. Copy the new token and update your configuration above</p>
              </div>
              <a 
                href="https://www.oanda.com/account/tpa/personal_token" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-red-300 hover:text-red-200 underline"
              >
                <ExternalLink className="h-3 w-3" />
                Open OANDA API Token Page
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OANDAErrorDisplay;
