
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, HelpCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOANDAIntegration } from '@/hooks/useOANDAIntegration';
import OANDAApiGuide from './OANDAApiGuide';
import OANDAConfigForm from './OANDAConfigForm';
import OANDASavedConfigs from './OANDASavedConfigs';
import OANDAStrategySettings from './OANDAStrategySettings';
import OANDAForwardTestingControl from './OANDAForwardTestingControl';

interface OANDAIntegrationProps {
  strategy: any;
  isForwardTestingActive: boolean;
  onToggleForwardTesting: (active: boolean) => void;
}

const OANDAIntegration: React.FC<OANDAIntegrationProps> = ({
  strategy,
  isForwardTestingActive,
  onToggleForwardTesting
}) => {
  const { toast } = useToast();
  const [showGuide, setShowGuide] = useState(false);
  
  const {
    config,
    connectionStatus,
    connectionError,
    savedConfigs,
    savedStrategies,
    selectedStrategy,
    isLoading,
    isTestingTrade,
    isConfigured,
    canStartTesting,
    handleConfigChange,
    handleTestConnection,
    handleSaveConfig,
    handleLoadConfig,
    handleLoadStrategy,
    handleTestTrade,
    handleDeleteStrategy,
    loadSelectedStrategy,
    loadSavedConfigs,
    loadSavedStrategies
  } = useOANDAIntegration();

  React.useEffect(() => {
    loadSavedConfigs();
    loadSavedStrategies();
    loadSelectedStrategy();
  }, []);

  const handleToggleForwardTesting = async () => {
    if (!isForwardTestingActive) {
      if (!config.accountId || !config.apiKey) {
        toast({
          title: "Configuration Required",
          description: "Please configure your OANDA API credentials first",
          variant: "destructive",
        });
        return;
      }

      if (connectionStatus !== 'success') {
        toast({
          title: "Test Connection First",
          description: "Please test your OANDA connection before starting forward testing",
          variant: "destructive",
        });
        return;
      }

      if (!selectedStrategy) {
        toast({
          title: "Strategy Required",
          description: "Please select a strategy with saved settings before starting forward testing",
          variant: "destructive",
        });
        return;
      }
    }
    
    onToggleForwardTesting(!isForwardTestingActive);
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5" />
                OANDA Forward Testing
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGuide(true)}
                className="border-slate-600 text-slate-300 hover:text-white"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Setup Guide
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Saved Configurations */}
        <OANDASavedConfigs 
          savedConfigs={savedConfigs}
          onLoadConfig={handleLoadConfig}
        />

        {/* Strategy Settings Selection */}
        <OANDAStrategySettings
          savedStrategies={savedStrategies}
          selectedStrategy={selectedStrategy}
          onLoadStrategy={handleLoadStrategy}
          onDeleteStrategy={handleDeleteStrategy}
        />

        {/* API Configuration Card */}
        <OANDAConfigForm
          config={config}
          onConfigChange={handleConfigChange}
          onTestConnection={handleTestConnection}
          onSaveConfig={handleSaveConfig}
          onTestTrade={handleTestTrade}
          connectionStatus={connectionStatus}
          connectionError={connectionError}
          isLoading={isLoading}
          isTestingTrade={isTestingTrade}
          canStartTesting={canStartTesting}
          isForwardTestingActive={isForwardTestingActive}
          connectionStatusIcon={getConnectionStatusIcon()}
        />

        {/* Forward Testing Control */}
        <OANDAForwardTestingControl
          isForwardTestingActive={isForwardTestingActive}
          selectedStrategy={selectedStrategy}
          config={config}
          canStartTesting={canStartTesting}
          isConfigured={isConfigured}
          connectionStatus={connectionStatus}
          onToggleForwardTesting={handleToggleForwardTesting}
          onShowGuide={() => setShowGuide(true)}
        />
      </div>

      <OANDAApiGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </>
  );
};

export default OANDAIntegration;
