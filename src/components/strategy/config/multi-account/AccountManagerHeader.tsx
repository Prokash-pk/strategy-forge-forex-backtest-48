
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import { Plus, Settings } from 'lucide-react';

interface AccountManagerHeaderProps {
  onAddAccount: () => void;
}

const AccountManagerHeader: React.FC<AccountManagerHeaderProps> = ({ onAddAccount }) => {
  return (
    <CardTitle className="flex items-center justify-between text-white">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        OANDA Accounts Manager
      </div>
      <Button
        onClick={onAddAccount}
        size="sm"
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Account
      </Button>
    </CardTitle>
  );
};

export default AccountManagerHeader;
