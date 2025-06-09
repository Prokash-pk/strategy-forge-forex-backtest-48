import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Settings, TrendingUp, Wifi, Monitor, Play, Activity, Server, BarChart3, Wrench } from 'lucide-react';
import OANDAConfigForm from './OANDAConfigForm';
import OANDAStrategySettings from './OANDAStrategySettings';
import OANDAForwardTestingControl from './OANDAForwardTestingControl';
import OANDATradingDashboard from './OANDATradingDashboard';
import OANDAPriceMonitorControl from './OANDAPriceMonitorControl';
import ForwardTestingDiagnostic from './ForwardTestingDiagnostic';
import BrowserKeepaliveControl from './BrowserKeepaliveControl';
import ServerSideTradingControl from './ServerSideTradingControl';
import { useOANDAIntegration } from '@/hooks/useOANDAIntegration';

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
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 bg-slate-700 h-auto p-1 gap-1">
              <TabsTrigger value="config" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configuration</span>
                <span className="sm:hidden">Config</span>
              </TabsTrigger>
              <TabsTrigger value="strategy" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Strategy</span>
                <span className="sm:hidden">Strategy</span>
              </TabsTrigger>
              <TabsTrigger value="monitor" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">Monitor</span>
                <span className="sm:hidden">Monitor</span>
              </TabsTrigger>
              <TabsTrigger value="control" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">Control</span>
                <span className="sm:hidden">Control</span>
              </TabsTrigger>
              <TabsTrigger value="keepalive" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Keepalive</span>
                <span className="sm:hidden">Live</span>
              </TabsTrigger>
              <TabsTrigger value="serverside" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
                <Server className="h-4 w-4" />
                <span className="hidden sm:inline">24/7 Server</span>
                <span className="sm:hidden">24/7</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Dash</span>
              </TabsTrigger>
              <TabsTrigger value="diagnostic" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">Diagnostic</span>
                <span className="sm:hidden">Debug</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="mt-6">
              <OANDAConfigForm
                config={config}
                savedConfigs={savedConfigs}
                onConfigChange={handleConfigChange}
                onTestConnection={handleTestConnection}
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
              <ForwardTestingDiagnostic />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default OANDAIntegration;
