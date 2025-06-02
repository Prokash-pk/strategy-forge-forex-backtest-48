
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import OANDAConfigForm from './OANDAConfigForm';
import OANDAStrategySettings from './OANDAStrategySettings';
import OANDAForwardTestingControl from './OANDAForwardTestingControl';
import OANDATradingDashboard from './OANDATradingDashboard';
import { useOANDAIntegration } from '@/hooks/useOANDAIntegration';
import { useOANDATrade } from '@/hooks/oanda/useOANDATrade';

interface OANDAIntegrationProps {
  selectedStrategy: any;
  onStrategyUpdate: (strategy: any) => void;
}

const OANDAIntegration: React.FC<OANDAIntegrationProps> = ({
  selectedStrategy,
  onStrategyUpdate
}) => {
  const {
    config,
    handleConfigChange,
    handleTestConnection,
    handleSaveConfig,
    connectionStatus,
    connectionError,
    isLoading,
    canStartTesting,
    isForwardTestingActive,
    connectionStatusIcon,
    isConfigured,
    handleToggleForwardTesting,
    handleShowGuide,
    savedStrategies,
    selectedStrategy: oandaSelectedStrategy,
    handleLoadStrategy,
    handleDeleteStrategy
  } = useOANDAIntegration();

  const { isTestingTrade, handleTestTrade } = useOANDATrade();

  const handleTestTradeClick = () => {
    handleTestTrade(config, oandaSelectedStrategy || selectedStrategy, connectionStatus);
  };

  // Get the appropriate icon component
  const getStatusIcon = () => {
    const IconComponent = connectionStatusIcon;
    if (connectionStatus === 'success') {
      return <IconComponent className="h-5 w-5 text-emerald-400" />;
    } else if (connectionStatus === 'testing') {
      return <IconComponent className="h-5 w-5 text-yellow-400 animate-spin" />;
    } else {
      return <IconComponent className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Status Overview */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5" />
            OANDA Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'success' ? 'bg-emerald-500' : 'bg-slate-500'
              }`} />
              <span className="text-sm text-slate-300">
                Connection: {connectionStatus === 'success' ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                isForwardTestingActive ? 'bg-blue-500' : 'bg-slate-500'
              }`} />
              <span className="text-sm text-slate-300">
                Forward Testing: {isForwardTestingActive ? 'Running' : 'Stopped'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant={config.environment === 'practice' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {config.environment === 'practice' ? 'Practice Mode' : 'Live Trading'}
              </Badge>
            </div>
          </div>

          {isForwardTestingActive && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-300 text-sm">
                  Forward testing is currently active. Stop it first to test individual trades.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
          <TabsTrigger value="config" className="data-[state=active]:bg-emerald-600">
            <Settings className="h-4 w-4 mr-2" />
            Config
          </TabsTrigger>
          <TabsTrigger value="strategy" className="data-[state=active]:bg-emerald-600">
            <TrendingUp className="h-4 w-4 mr-2" />
            Strategy
          </TabsTrigger>
          <TabsTrigger value="control" className="data-[state=active]:bg-emerald-600">
            <Activity className="h-4 w-4 mr-2" />
            Control
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-emerald-600">
            <Activity className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <OANDAConfigForm
            config={{ ...config, enabled: config.enabled || false }}
            onConfigChange={handleConfigChange}
            onTestConnection={handleTestConnection}
            onSaveConfig={handleSaveConfig}
            onTestTrade={handleTestTradeClick}
            connectionStatus={connectionStatus}
            connectionError={connectionError}
            isLoading={isLoading}
            isTestingTrade={isTestingTrade}
            canStartTesting={canStartTesting}
            isForwardTestingActive={isForwardTestingActive}
            connectionStatusIcon={getStatusIcon()}
          />
        </TabsContent>

        <TabsContent value="strategy">
          <OANDAStrategySettings
            savedStrategies={savedStrategies || []}
            selectedStrategy={oandaSelectedStrategy}
            onLoadStrategy={handleLoadStrategy}
            onDeleteStrategy={handleDeleteStrategy}
          />
        </TabsContent>

        <TabsContent value="control">
          <OANDAForwardTestingControl
            config={config}
            selectedStrategy={oandaSelectedStrategy}
            connectionStatus={connectionStatus}
            isForwardTestingActive={isForwardTestingActive}
            canStartTesting={canStartTesting}
            isConfigured={isConfigured}
            onToggleForwardTesting={handleToggleForwardTesting}
            onShowGuide={handleShowGuide}
          />
        </TabsContent>

        <TabsContent value="dashboard">
          <OANDATradingDashboard
            config={config}
            connectionStatus={connectionStatus}
            isForwardTestingActive={isForwardTestingActive}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OANDAIntegration;
