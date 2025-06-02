
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SavedOANDAConfig, OANDAConfig } from '@/types/oanda';

interface UseAccountManagerProps {
  currentConfig: OANDAConfig;
  onSaveNewConfig: (config: OANDAConfig & { configName: string }) => void;
  onDeleteConfig: (configId: string) => void;
}

export const useAccountManager = ({
  currentConfig,
  onSaveNewConfig,
  onDeleteConfig
}: UseAccountManagerProps) => {
  const { toast } = useToast();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');

  const handleSaveCurrentConfig = () => {
    if (!newConfigName.trim()) {
      toast({
        title: "Configuration Name Required",
        description: "Please enter a name for your configuration",
        variant: "destructive",
      });
      return;
    }

    if (!currentConfig.accountId || !currentConfig.apiKey) {
      toast({
        title: "Configuration Incomplete",
        description: "Please fill in all account details before saving",
        variant: "destructive",
      });
      return;
    }

    onSaveNewConfig({
      ...currentConfig,
      configName: newConfigName.trim()
    });

    setNewConfigName('');
    setIsAddingNew(false);

    toast({
      title: "Configuration Saved",
      description: `"${newConfigName}" has been saved successfully`,
    });
  };

  const handleDeleteConfig = (configId: string, configName: string) => {
    onDeleteConfig(configId);
    toast({
      title: "Configuration Deleted",
      description: `"${configName}" has been removed`,
    });
  };

  const handleAddAccount = () => {
    setIsAddingNew(!isAddingNew);
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setNewConfigName('');
  };

  return {
    isAddingNew,
    newConfigName,
    setNewConfigName,
    handleSaveCurrentConfig,
    handleDeleteConfig,
    handleAddAccount,
    handleCancel
  };
};
