
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Database, Download, RefreshCw, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DataManager = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD=X');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const { toast } = useToast();

  const symbols = [
    { value: 'EURUSD=X', label: 'EUR/USD', name: 'Euro / US Dollar' },
    { value: 'GBPUSD=X', label: 'GBP/USD', name: 'British Pound / US Dollar' },
    { value: 'USDJPY=X', label: 'USD/JPY', name: 'US Dollar / Japanese Yen' },
    { value: 'AUDUSD=X', label: 'AUD/USD', name: 'Australian Dollar / US Dollar' },
    { value: 'USDCAD=X', label: 'USD/CAD', name: 'US Dollar / Canadian Dollar' },
    { value: 'USDCHF=X', label: 'USD/CHF', name: 'US Dollar / Swiss Franc' },
    { value: 'NZDUSD=X', label: 'NZD/USD', name: 'New Zealand Dollar / US Dollar' },
    { value: 'EURGBP=X', label: 'EUR/GBP', name: 'Euro / British Pound' },
    { value: 'EURJPY=X', label: 'EUR/JPY', name: 'Euro / Japanese Yen' },
    { value: 'GBPJPY=X', label: 'GBP/JPY', name: 'British Pound / Japanese Yen' }
  ];

  const timeframes = [
    { value: '1m', label: '1 Minute', maxPeriod: '7 days', warning: 'Limited to 7 days' },
    { value: '2m', label: '2 Minutes', maxPeriod: '60 days', warning: 'Limited to 60 days' },
    { value: '5m', label: '5 Minutes', maxPeriod: '60 days', warning: 'Limited to 60 days' },
    { value: '15m', label: '15 Minutes', maxPeriod: '60 days', warning: 'Limited to 60 days' },
    { value: '30m', label: '30 Minutes', maxPeriod: '60 days', warning: 'Limited to 60 days' },
    { value: '1h', label: '1 Hour', maxPeriod: '730 days', warning: null },
    { value: '1d', label: '1 Day', maxPeriod: 'Years', warning: null },
    { value: '1wk', label: '1 Week', maxPeriod: 'Years', warning: null },
    { value: '1mo', label: '1 Month', maxPeriod: 'Years', warning: null }
  ];

  const cachedData = [
    { symbol: 'EURUSD=X', timeframe: '1h', period: '2024-01-01 to 2024-12-31', size: '8.7 MB', lastUpdate: '2024-01-15' },
    { symbol: 'GBPUSD=X', timeframe: '5m', period: '2024-11-01 to 2024-12-31', size: '12.3 MB', lastUpdate: '2024-01-14' },
    { symbol: 'USDJPY=X', timeframe: '1d', period: '2020-01-01 to 2024-12-31', size: '2.1 MB', lastUpdate: '2024-01-13' }
  ];

  const downloadData = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Simulate download progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setDownloadProgress(i);
      }

      toast({
        title: "Data Downloaded",
        description: `Successfully downloaded ${selectedSymbol.replace('=X', '')} ${selectedTimeframe} data`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "An error occurred while downloading data",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const selectedTimeframeData = timeframes.find(tf => tf.value === selectedTimeframe);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Data Download */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Download className="h-5 w-5" />
            Download Market Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="symbol" className="text-slate-300">Currency Pair</Label>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {symbols.map(symbol => (
                  <SelectItem key={symbol.value} value={symbol.value} className="text-white">
                    <div>
                      <div className="font-semibold">{symbol.label}</div>
                      <div className="text-xs text-slate-400">{symbol.name}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="timeframe" className="text-slate-300">Timeframe</Label>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {timeframes.map(tf => (
                  <SelectItem key={tf.value} value={tf.value} className="text-white">
                    <div className="flex items-center justify-between w-full">
                      <span>{tf.label}</span>
                      {tf.warning && (
                        <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-400">
                          {tf.warning}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTimeframeData?.warning && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-orange-500/10 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-orange-400">{selectedTimeframeData.warning}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-slate-300">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-slate-300">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          {isDownloading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Downloading...</span>
                <span className="text-slate-400">{downloadProgress}%</span>
              </div>
              <Progress value={downloadProgress} className="h-2" />
            </div>
          )}

          <Button
            onClick={downloadData}
            disabled={isDownloading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Cached Data */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Database className="h-5 w-5" />
            Cached Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cachedData.map((data, index) => (
              <div key={index} className="p-4 bg-slate-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">
                      {data.symbol.replace('=X', '')}
                    </Badge>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {data.timeframe}
                    </Badge>
                  </div>
                  <span className="text-slate-400 text-sm">{data.size}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="h-4 w-4" />
                    <span>{data.period}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="h-4 w-4" />
                    <span>Updated {data.lastUpdate}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                    Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Info */}
      <div className="lg:col-span-2">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Yahoo Finance Data Limitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="font-semibold text-white mb-2">1-Minute Data</h4>
                <p className="text-slate-400 text-sm">Maximum 7 calendar days of historical data available</p>
              </div>
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Intraday (2m-30m)</h4>
                <p className="text-slate-400 text-sm">Up to 60 days of historical data for short timeframes</p>
              </div>
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Hourly Data</h4>
                <p className="text-slate-400 text-sm">Approximately 730 days (2 years) of historical data</p>
              </div>
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Daily & Above</h4>
                <p className="text-slate-400 text-sm">Years of historical data available for long-term analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataManager;
