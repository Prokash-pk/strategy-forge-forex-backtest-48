
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { useOANDAIntegration } from '@/hooks/useOANDAIntegration';
import OANDAIntegrationHeader from './oanda-integration/OANDAIntegrationHeader';
import OANDAIntegrationTabs from './oanda-integration/OANDAIntegrationTabs';
import OANDATabContent from './oanda-integration/OANDATabContent';

const OANDAIntegration: React.FC = () => {
  const {
    config,
    savedConfigs,
    connectionStatus,
    connectionError,
    isConnected,
    lastConnectedAt,
    accountInfo,
    savedStrategies,
    selectedStrategy,
    isLoadingStrategies,
    isLoading,
    isTestingTrade,
    isConfigured,
    canStartTesting,
    isForwardTestingActive,
    connectionStatusIcon: ConnectionStatusIcon,
    handleConfigChange,
    handleTestConnection,
    handleManualConnect,
    handleSaveConfig,
    handleSaveNewConfig,
    handleLoadConfig,
    handleDeleteConfig,
    handleLoadStrategy,
    handleTestTrade,
    handleDeleteStrategy,
    handleToggleForwardTesting,
    handleShowGuide,
    loadSavedConfigs,
    loadSavedStrategies,
    retryCount,
    isAutoReconnecting
  } = useOANDAIntegration();

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle>
            <OANDAIntegrationHeader
              isConnected={isConnected}
              connectionStatus={connectionStatus}
              isConfigured={Boolean(isConfigured)}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="config" className="w-full">
            <OANDAIntegrationTabs />
            <OANDATabContent
              config={config}
              savedConfigs={savedConfigs}
              connectionStatus={connectionStatus}
              connectionError={connectionError}
              isConnected={isConnected}
              lastConnectedAt={lastConnectedAt}
              accountInfo={accountInfo}
              savedStrategies={savedStrategies}
              selectedStrategy={selectedStrategy}
              isLoadingStrategies={isLoadingStrategies}
              isLoading={isLoading}
              isTestingTrade={isTestingTrade}
              isConfigured={isConfigured}
              canStartTesting={canStartTesting}
              isForwardTestingActive={isForwardTestingActive}
              connectionStatusIcon={ConnectionStatusIcon ? <ConnectionStatusIcon className="h-4 w-4" /> : null}
              retryCount={retryCount}
              isAutoReconnecting={isAutoReconnecting}
              handleConfigChange={handleConfigChange}
              handleTestConnection={handleTestConnection}
              handleManualConnect={handleManualConnect}
              handleSaveConfig={handleSaveConfig}
              handleSaveNewConfig={handleSaveNewConfig}
              handleLoadConfig={handleLoadConfig}
              handleDeleteConfig={handleDeleteConfig}
              handleLoadStrategy={handleLoadStrategy}
              handleTestTrade={handleTestTrade}
              handleDeleteStrategy={handleDeleteStrategy}
              handleToggleForwardTesting={handleToggleForwardTesting}
              handleShowGuide={handleShowGuide}
              loadSavedStrategies={loadSavedStrategies}
            />
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default OANDAIntegration;
