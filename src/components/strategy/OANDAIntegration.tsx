
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Settings, TrendingUp } from 'lucide-react';
import OANDAConfigForm from './OANDAConfigForm';
import OANDAStrategySettings from './OANDAStrategySettings';
import OANDAForwardTestingControl from './OANDAForwardTestingControl';
import OANDATradingDashboard from './OANDATradingDashboard';
import { useOANDAIntegration } from '@/hooks/useOANDAIntegration';

const OANDAIntegration: React.FC = () => {
  const {
    config,
    savedConfigs,
    connectionStatus,
    connectionError,
    savedStrategies,
    selectedStrategy,
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
    loadSelectedStrategy,
    loadSavedConfigs,
    loadSavedStrategies
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
              {connectionStatus === 'success' && (
                <Badge variant="default" className="bg-emerald-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
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
            <TabsList className="grid w-full grid-cols-4 bg-slate-700">
              <TabsTrigger value="config" className="data-[state=active]:bg-slate-600">
                Configuration
              </TabsTrigger>
              <TabsTrigger value="strategy" className="data-[state=active]:bg-slate-600">
                Strategy
              </TabsTrigger>
              <TabsTrigger value="control" className="data-[state=active]:bg-slate-600">
                Control
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-600">
                Dashboard
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
                connectionError={connectionError}
                isLoading={isLoading}
                isTestingTrade={isTestingTrade}
                canStartTesting={canStartTesting}
                isForwardTestingActive={isForwardTestingActive}
                connectionStatusIcon={<ConnectionStatusIcon className="h-4 w-4" />}
              />
            </TabsContent>

            <TabsContent value="strategy" className="mt-6">
              <OANDAStrategySettings
                savedStrategies={savedStrategies}
                selectedStrategy={selectedStrategy}
                onLoadStrategy={handleLoadStrategy}
                onDeleteStrategy={handleDeleteStrategy}
                onRefresh={() => {
                  loadSelectedStrategy();
                  loadSavedStrategies();
                }}
              />
            </TabsContent>

            <TabsContent value="control" className="mt-6">
              <OANDAForwardTestingControl
                isForwardTestingActive={isForwardTestingActive}
                selectedStrategy={selectedStrategy}
                config={config}
                canStartTesting={canStartTesting}
                isConfigured={isConfigured}
                connectionStatus={connectionStatus}
                onToggleForwardTesting={handleToggleForwardTesting}
                onShowGuide={handleShowGuide}
              />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-6">
              <OANDATradingDashboard
                isActive={isForwardTestingActive}
                strategy={selectedStrategy}
                environment={config.environment}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default OANDAIntegration;
