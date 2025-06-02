
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OANDACredentialsFormProps {
  accountId: string;
  apiKey: string;
  onAccountIdChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
}

const OANDACredentialsForm: React.FC<OANDACredentialsFormProps> = ({
  accountId,
  apiKey,
  onAccountIdChange,
  onApiKeyChange
}) => {
  return (
    <>
      {/* Account ID */}
      <div className="space-y-2">
        <Label htmlFor="accountId" className="text-slate-300">Account ID</Label>
        <Input
          id="accountId"
          type="text"
          placeholder="101-001-12345678-001"
          value={accountId}
          onChange={(e) => onAccountIdChange(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
        />
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="apiKey" className="text-slate-300">API Token</Label>
        <Input
          id="apiKey"
          type="password"
          placeholder="Enter your OANDA API token"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
        />
      </div>
    </>
  );
};

export default OANDACredentialsForm;
