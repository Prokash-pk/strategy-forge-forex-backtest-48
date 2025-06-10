
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Settings, TrendingUp, Wifi } from 'lucide-react';
import OANDAConfigForm from './OANDAConfigForm';
import OANDAStrategySettings from './OANDAStrategySettings';
import TradingControlCenter from './TradingControlCenter';
import OANDAPriceMonitorControl from './OANDAPriceMonitorControl';
import { useOANDAIntegration } from '@/hooks/useOANDAIntegration';

const OANDAIntegrationSimplified: React.FC = () => {
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
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              OANDA Live Trading Integration
            </div>
            <div className="flex items-center gap-2">
              {isConnected && (
                <Badge variant="default" className="bg-emerald-600">
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
              {connectionStatus === 'success' && !isConnected && (
                <Badge variant="default" className="bg-emerald-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              )}
              {connectionStatus === 'error' && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Error
                </Badge>
              )}
              {!isConfigured && (
                <Badge variant="secondary" className="bg-slate-600">
                  <Settings className="h-3 w-3 mr-1" />
                  Setup Required
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-700 h-auto p-1 gap-1">
              <TabsTrigger value="setup" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
                <Settings className="h-4 w-4" />
                Setup
              </TabsTrigger>
              <TabsTrigger value="strategy" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
                <TrendingUp className="h-4 w-4" />
                Strategy
              </TabsTrigger>
              <TabsTrigger value="trading" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
                <TrendingUp className="h-4 w-4" />
                Trading
              </TabsTrigger>
              <TabsTrigger value="monitor" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
                <Wifi className="h-4 w-4" />
                Monitor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="mt-6">
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
                connectionStatusIcon={ConnectionStatusIcon ? <ConnectionStatusIcon className="h-4 w-4" /> : null}
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

            <TabsContent value="trading" className="mt-6">
              <TradingControlCenter
                strategy={selectedStrategy}
                config={config}
                isConfigured={Boolean(isConfigured)}
                isForwardTestingActive={Boolean(isForwardTestingActive)}
                onToggleForwardTesting={handleToggleForwardTesting}
                connectionStatus={connectionStatus}
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default OANDAIntegrationSimplified;
