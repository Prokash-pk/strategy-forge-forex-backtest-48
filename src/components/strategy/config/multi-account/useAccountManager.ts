
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SavedOANDAConfig, OANDAConfig } from '@/types/oanda';

interface UseAccountManagerProps {
  currentConfig: OANDAConfig;
  onSaveNewConfig: (config: OANDAConfig & { configName: string }) => void;
  onDeleteConfig: (configId: string) => void;
  loadSavedConfigs: () => Promise<void>;
}

export const useAccountManager = ({
  currentConfig,
  onSaveNewConfig,
  onDeleteConfig,
  loadSavedConfigs
}: UseAccountManagerProps) => {
  const { toast } = useToast();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');

  const handleSaveCurrentConfig = async () => {
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
        description: "Please fill in all account details and test connection before saving",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Saving config:', { ...currentConfig, configName: newConfigName.trim() });
      
      await onSaveNewConfig({
        ...currentConfig,
        configName: newConfigName.trim(),
        enabled: true // Enable the new config for 24/7 connection
      });

      // Reset form state after successful save
      setNewConfigName('');
      setIsAddingNew(false);

      // Reload saved configs to show the new one
      await loadSavedConfigs();

      toast({
        title: "✅ Account Connected 24/7",
        description: `"${newConfigName}" is now connected and will stay active 24/7 until you disconnect it.`,
      });
    } catch (error) {
      console.error('Failed to save config:', error);
      toast({
        title: "Connection Failed",
        description: "Could not establish 24/7 connection. Please test your credentials first.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfig = async (configId: string, configName: string) => {
    try {
      await onDeleteConfig(configId);
      await loadSavedConfigs(); // Reload after deletion
      toast({
        title: "Account Disconnected",
        description: `"${configName}" has been disconnected and removed`,
      });
    } catch (error) {
      console.error('Failed to delete config:', error);
      toast({
        title: "Delete Failed",
        description: "Could not disconnect account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddAccount = () => {
    setIsAddingNew(!isAddingNew);
    if (!isAddingNew) {
      // When opening the form, clear any previous input
      setNewConfigName('');
    }
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
