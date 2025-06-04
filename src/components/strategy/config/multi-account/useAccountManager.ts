
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SavedOANDAConfig, OANDAConfig } from '@/types/oanda';

interface UseAccountManagerProps {
  currentConfig: OANDAConfig;
  onSaveNewConfig: (config: OANDAConfig & { configName: string }) => Promise<void>;
  onDeleteConfig: (configId: string) => Promise<void>;
  loadSavedConfigs: () => Promise<void>;
  savedConfigs: SavedOANDAConfig[];
}

export const useAccountManager = ({
  currentConfig,
  onSaveNewConfig,
  onDeleteConfig,
  loadSavedConfigs,
  savedConfigs
}: UseAccountManagerProps) => {
  const { toast } = useToast();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

    // Check for duplicate account ID
    const existingConfig = savedConfigs.find(config => config.accountId === currentConfig.accountId);
    if (existingConfig) {
      toast({
        title: "Account Already Connected",
        description: `Account ${currentConfig.accountId} is already connected as "${existingConfig.configName}"`,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log('Saving config:', { ...currentConfig, configName: newConfigName.trim() });
      
      await onSaveNewConfig({
        ...currentConfig,
        configName: newConfigName.trim(),
        enabled: true
      });

      // Force reload saved configs to show the new account immediately
      console.log('Reloading saved configs after save...');
      await loadSavedConfigs();

      // Reset form state after successful save
      setNewConfigName('');
      setIsAddingNew(false);

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
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    try {
      console.log('Disconnecting account:', configId);
      await onDeleteConfig(configId);
      
      // Force reload saved configs to update the UI immediately
      console.log('Reloading saved configs after disconnect...');
      await loadSavedConfigs();
      
      toast({
        title: "Account Disconnected",
        description: "Account has been disconnected and removed from the manager",
      });
    } catch (error) {
      console.error('Failed to disconnect config:', error);
      toast({
        title: "Disconnect Failed",
        description: "Could not disconnect account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddAccount = () => {
    setIsAddingNew(!isAddingNew);
    if (!isAddingNew) {
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
    handleCancel,
    isSaving
  };
};
