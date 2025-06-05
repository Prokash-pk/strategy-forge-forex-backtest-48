
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInteractiveBrokers } from '@/hooks/useInteractiveBrokers';
import { Settings, Wifi, WifiOff, Play, Square, TestTube, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

const InteractiveBrokersIntegration: React.FC = () => {
  const {
    config,
    isConnected,
    isConnecting,
    positions,
    orders,
    accountSummary,
    handleConfigChange,
    connect,
    disconnect,
    closePosition
  } = useInteractiveBrokers();

  const handleConnect = () => {
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Interactive Brokers Integration
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {config.paperTrading && (
              <Badge variant="secondary" className="bg-blue-600">
                Paper Trading
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="connection" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-700">
            <TabsTrigger value="connection" className="data-[state=active]:bg-slate-600">
              Connection
            </TabsTrigger>
            <TabsTrigger value="account" className="data-[state=active]:bg-slate-600">
              Account
            </TabsTrigger>
            <TabsTrigger value="positions" className="data-[state=active]:bg-slate-600">
              Positions
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-slate-600">
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="mt-6 space-y-6">
            {/* Connection Status */}
            <div className={`p-3 rounded-lg border ${
              isConnected 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  isConnected ? 'text-green-300' : 'text-red-300'
                }`}>
                  {isConnected ? '🟢 Connected to Interactive Brokers' : '🔴 Not Connected'}
                </span>
                <div className="flex gap-2">
                  {isConnected ? (
                    <Button
                      onClick={handleDisconnect}
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                    >
                      <Square className="h-3 w-3 mr-1" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isConnecting ? (
                        <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full mr-1" />
                      ) : (
                        <Play className="h-3 w-3 mr-1" />
                      )}
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Connection Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Connection Settings</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="host" className="text-slate-300">Host</Label>
                  <Input
                    id="host"
                    value={config.host}
                    onChange={(e) => handleConfigChange('host', e.target.value)}
                    placeholder="localhost"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="port" className="text-slate-300">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={config.port}
                    onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                    placeholder="7497"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="clientId" className="text-slate-300">Client ID</Label>
                  <Input
                    id="clientId"
                    type="number"
                    value={config.clientId}
                    onChange={(e) => handleConfigChange('clientId', parseInt(e.target.value))}
                    placeholder="1"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-slate-600" />

            {/* Trading Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Trading Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orderSize" className="text-slate-300">Default Order Size</Label>
                  <Input
                    id="orderSize"
                    type="number"
                    value={config.defaultOrderSize}
                    onChange={(e) => handleConfigChange('defaultOrderSize', parseInt(e.target.value))}
                    placeholder="10000"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="riskPerTrade" className="text-slate-300">Risk Per Trade %</Label>
                  <Input
                    id="riskPerTrade"
                    type="number"
                    step="0.1"
                    value={config.riskPerTrade}
                    onChange={(e) => handleConfigChange('riskPerTrade', parseFloat(e.target.value))}
                    placeholder="1.0"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="paperTrading" className="text-slate-300">Paper Trading</Label>
                  <p className="text-xs text-slate-400">Use virtual money for testing</p>
                </div>
                <Switch
                  id="paperTrading"
                  checked={config.paperTrading}
                  onCheckedChange={(checked) => handleConfigChange('paperTrading', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoTrading" className="text-slate-300">Auto Trading</Label>
                  <p className="text-xs text-slate-400">Automatically execute signals from backtests</p>
                </div>
                <Switch
                  id="autoTrading"
                  checked={config.autoTrading}
                  onCheckedChange={(checked) => handleConfigChange('autoTrading', checked)}
                />
              </div>
            </div>

            {/* Setup Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-blue-300 font-medium mb-2">📋 Setup Instructions</h4>
              <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
                <li>Download and install TWS (Trader Workstation) from Interactive Brokers</li>
                <li>Enable API access in TWS: File → Global Configuration → API → Settings</li>
                <li>Set "Enable ActiveX and Socket Clients" to TRUE</li>
                <li>Add your IP address (127.0.0.1 for local) to trusted IPs</li>
                <li>For paper trading, use port 7497. For live trading, use port 7496</li>
                <li>Ensure TWS is running before clicking "Connect"</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="account" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Account Summary</h3>
              
              {accountSummary ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="bg-slate-700 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-400" />
                        <div>
                          <p className="text-xs text-slate-400">Net Liquidation</p>
                          <p className="text-lg font-bold text-white">
                            {formatCurrency(accountSummary.netLiquidation, accountSummary.currency)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-700 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-400" />
                        <div>
                          <p className="text-xs text-slate-400">Available Funds</p>
                          <p className="text-lg font-bold text-white">
                            {formatCurrency(accountSummary.availableFunds, accountSummary.currency)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-700 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        <div>
                          <p className="text-xs text-slate-400">Buying Power</p>
                          <p className="text-lg font-bold text-white">
                            {formatCurrency(accountSummary.buyingPower, accountSummary.currency)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  {isConnected ? 'Loading account data...' : 'Connect to view account information'}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="positions" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Open Positions</h3>
              </div>
              
              {positions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-600">
                      <TableHead className="text-slate-300">Symbol</TableHead>
                      <TableHead className="text-slate-300">Position</TableHead>
                      <TableHead className="text-slate-300">Market Price</TableHead>
                      <TableHead className="text-slate-300">Market Value</TableHead>
                      <TableHead className="text-slate-300">Unrealized P&L</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position) => (
                      <TableRow key={position.symbol} className="border-slate-600">
                        <TableCell className="text-white font-medium">{position.symbol}</TableCell>
                        <TableCell className="text-white">{position.position.toLocaleString()}</TableCell>
                        <TableCell className="text-white">{position.marketPrice.toFixed(4)}</TableCell>
                        <TableCell className="text-white">{formatCurrency(position.marketValue)}</TableCell>
                        <TableCell className={`font-medium ${
                          position.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatCurrency(position.unrealizedPnL)}
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => closePosition(position.symbol)}
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                          >
                            Close
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  {isConnected ? 'No open positions' : 'Connect to view positions'}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Recent Orders</h3>
              
              {orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-600">
                      <TableHead className="text-slate-300">Order ID</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Filled</TableHead>
                      <TableHead className="text-slate-300">Remaining</TableHead>
                      <TableHead className="text-slate-300">Avg Fill Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.orderId} className="border-slate-600">
                        <TableCell className="text-white font-medium">{order.orderId}</TableCell>
                        <TableCell>
                          <Badge variant={
                            order.status === 'Filled' ? 'default' :
                            order.status === 'Cancelled' ? 'destructive' :
                            'secondary'
                          }>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">{order.filled}</TableCell>
                        <TableCell className="text-white">{order.remaining}</TableCell>
                        <TableCell className="text-white">{order.avgFillPrice.toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  {isConnected ? 'No recent orders' : 'Connect to view orders'}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default InteractiveBrokersIntegration;
