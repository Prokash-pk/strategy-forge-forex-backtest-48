
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import OANDAConfigForm from '../OANDAConfigForm';
import OANDAStrategySettings from '../OANDAStrategySettings';
import OANDAForwardTestingControl from '../OANDAForwardTestingControl';
import OANDATradingDashboard from '../OANDATradingDashboard';
import OANDAPriceMonitorControl from '../OANDAPriceMonitorControl';
import ForwardTestingDiagnostic from '../ForwardTestingDiagnostic';
import BrowserKeepaliveControl from '../BrowserKeepaliveControl';
import ServerSideTradingControl from '../ServerSideTradingControl';
import TradingReadinessDiagnostic from '../diagnostics/TradingReadinessDiagnostic';
import { OANDAConfig, SavedOANDAConfig, StrategySettings } from '@/types/oanda';

interface OANDATabContentProps {
  config: OANDAConfig;
  savedConfigs: SavedOANDAConfig[];
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
  connectionError: string | null;
  isConnected: boolean;
  lastConnectedAt: string | null;
  accountInfo: any | null;
  savedStrategies: StrategySettings[];
  selectedStrategy: StrategySettings | null;
  isLoadingStrategies: boolean;
  isLoading: boolean;
  isTestingTrade: boolean;
  isConfigured: boolean;
  canStartTesting: boolean;
  isForwardTestingActive: boolean;
  connectionStatusIcon: React.ReactNode;
  retryCount: number;
  isAutoReconnecting: boolean;
  handleConfigChange: (field: keyof OANDAConfig, value: any) => void;
  handleTestConnection: () => void;
  handleManualConnect: () => void;
  handleSaveConfig: () => void;
  handleSaveNewConfig: (config: OANDAConfig & { configName: string }) => void;
  handleLoadConfig: (config: SavedOANDAConfig) => void;
  handleDeleteConfig: (configId: string) => void;
  handleLoadStrategy: (strategy: StrategySettings) => void;
  handleTestTrade: () => void;
  handleDeleteStrategy: (strategyId: string) => void;
  handleToggleForwardTesting: () => void;
  handleShowGuide: () => void;
  loadSavedStrategies: () => void;
}

const OANDATabContent: React.FC<OANDATabContentProps> = ({
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
  connectionStatusIcon,
  retryCount,
  isAutoReconnecting,
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
  loadSavedStrategies
}) => {
  return (
    <>
      <TabsContent value="config" className="mt-6">
        <OANDAConfigForm
          config={config}
          savedConfigs={savedConfigs}
          onConfigChange={handleConfigChange}
          onTestConnection={handleTestConnection}
          onManualConnect={handleManualConnect}
          onSaveConfig={handleSaveConfig}
          onSaveNewConfig={handleSaveNewConfig}
          onLoadConfig={handleLoadConfig}
          onDeleteConfig={handleDeleteConfig}
          onTestTrade={handleTestTrade}
          connectionStatus={connectionStatus}
          connectionError={connectionError || ''}
          isConnected={isConnected}
          lastConnectedAt={lastConnectedAt}
          accountInfo={accountInfo}
          isLoading={Boolean(isLoading)}
          isTestingTrade={Boolean(isTestingTrade)}
          canStartTesting={Boolean(canStartTesting)}
          isForwardTestingActive={Boolean(isForwardTestingActive)}
          connectionStatusIcon={connectionStatusIcon}
          connectionProps={{
            retryCount,
            isAutoReconnecting
          }}
        />
      </TabsContent>

      <TabsContent value="strategy" className="mt-6">
        <OANDAStrategySettings
          savedStrategies={savedStrategies}
          selectedStrategy={selectedStrategy}
          isLoadingStrategies={isLoadingStrategies}
          onLoadStrategy={handleLoadStrategy}
          onDeleteStrategy={handleDeleteStrategy}
          onRefresh={loadSavedStrategies}
        />
      </TabsContent>

      <TabsContent value="monitor" className="mt-6">
        <OANDAPriceMonitorControl
          config={config}
          strategy={selectedStrategy}
          isConfigured={Boolean(isConfigured)}
          connectionStatus={connectionStatus}
        />
      </TabsContent>

      <TabsContent value="control" className="mt-6">
        <OANDAForwardTestingControl
          isForwardTestingActive={Boolean(isForwardTestingActive)}
          selectedStrategy={selectedStrategy}
          config={config}
          canStartTesting={Boolean(canStartTesting)}
          isConfigured={Boolean(isConfigured)}
          connectionStatus={connectionStatus}
          onToggleForwardTesting={handleToggleForwardTesting}
          onShowGuide={handleShowGuide}
        />
      </TabsContent>

      <TabsContent value="keepalive" className="mt-6">
        <BrowserKeepaliveControl />
      </TabsContent>

      <TabsContent value="serverside" className="mt-6">
        <ServerSideTradingControl
          strategy={selectedStrategy}
          config={config}
          isConfigured={Boolean(isConfigured)}
        />
      </TabsContent>

      <TabsContent value="dashboard" className="mt-6">
        <OANDATradingDashboard
          isActive={Boolean(isForwardTestingActive)}
          strategy={selectedStrategy}
          environment={config.environment}
          oandaConfig={config}
          onToggleForwardTesting={handleToggleForwardTesting}
        />
      </TabsContent>

      <TabsContent value="diagnostic" className="mt-6">
        <div className="space-y-6">
          <TradingReadinessDiagnostic />
          <ForwardTestingDiagnostic />
        </div>
      </TabsContent>
    </>
  );
};

export default OANDATabContent;
