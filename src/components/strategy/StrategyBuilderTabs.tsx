
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import PythonStrategyTab from './PythonStrategyTab';
import OANDAConfigForm from './OANDAConfigForm';
import OANDAForwardTestingControl from './OANDAForwardTestingControl';
import ComprehensiveForwardTestingDiagnostics from './diagnostics/ComprehensiveForwardTestingDiagnostics';
import TradingReadinessDiagnostic from './diagnostics/TradingReadinessDiagnostic';
import ComprehensiveDiagnostics from './dashboard/ComprehensiveDiagnostics';

interface StrategyBuilderTabsProps {
  strategy: any;
  onStrategyChange: (updates: any) => void;
  onRunBacktest?: () => void;
  isRunning?: boolean;
  backtestResults?: any;
  oandaIntegration: any;
}

const StrategyBuilderTabs: React.FC<StrategyBuilderTabsProps> = ({
  strategy,
  onStrategyChange,
  onRunBacktest,
  isRunning = false,
  backtestResults,
  oandaIntegration
}) => {
  return (
    <Tabs defaultValue="strategy" className="w-full">
      <TabsList className="grid w-full grid-cols-5 bg-slate-800">
        <TabsTrigger value="strategy">Strategy Code</TabsTrigger>
        <TabsTrigger value="oanda">OANDA Config</TabsTrigger>
        <TabsTrigger value="forward-testing">Forward Testing</TabsTrigger>
        <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        <TabsTrigger value="troubleshoot">Troubleshoot</TabsTrigger>
      </TabsList>

      <TabsContent value="strategy" className="space-y-4">
        <PythonStrategyTab
          strategy={strategy}
          onStrategyChange={onStrategyChange}
          onRunBacktest={onRunBacktest}
          isRunning={isRunning}
          backtestResults={backtestResults}
        />
      </TabsContent>

      <TabsContent value="oanda" className="space-y-4">
        <OANDAConfigForm
          config={oandaIntegration.config}
          savedConfigs={oandaIntegration.savedConfigs}
          onConfigChange={oandaIntegration.handleConfigChange}
          onTestConnection={oandaIntegration.handleTestConnection}
          onManualConnect={oandaIntegration.handleManualConnect}
          onSaveConfig={oandaIntegration.handleSaveConfig}
          onSaveNewConfig={oandaIntegration.handleSaveNewConfig}
          onLoadConfig={oandaIntegration.handleLoadConfig}
          onDeleteConfig={oandaIntegration.handleDeleteConfig}
          onTestTrade={oandaIntegration.handleTestTrade}
          connectionStatus={oandaIntegration.connectionStatus}
          connectionError={oandaIntegration.connectionError || ''}
          isConnected={oandaIntegration.isConnected}
          lastConnectedAt={oandaIntegration.lastConnectedAt}
          accountInfo={oandaIntegration.accountInfo}
          isLoading={oandaIntegration.isLoading}
          isTestingTrade={oandaIntegration.isTestingTrade}
          canStartTesting={oandaIntegration.canStartTesting}
          isForwardTestingActive={oandaIntegration.isForwardTestingActive}
          connectionStatusIcon={oandaIntegration.connectionStatusIcon}
          connectionProps={{
            retryCount: oandaIntegration.retryCount,
            isAutoReconnecting: oandaIntegration.isAutoReconnecting
          }}
        />
      </TabsContent>

      <TabsContent value="forward-testing" className="space-y-4">
        <OANDAForwardTestingControl />
      </TabsContent>

      <TabsContent value="diagnostics" className="space-y-4">
        <TradingReadinessDiagnostic />
      </TabsContent>

      <TabsContent value="troubleshoot" className="space-y-4">
        <ComprehensiveForwardTestingDiagnostics />
        <ComprehensiveDiagnostics />
      </TabsContent>
    </Tabs>
  );
};

export default StrategyBuilderTabs;
