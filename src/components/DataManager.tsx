
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Database, Download, RefreshCw, Calendar, Clock, AlertTriangle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DataManager = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD=X');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
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
    { 
      value: '1m', 
      label: '1 Minute', 
      maxPeriod: '7 days', 
      warning: 'Limited to 7 days',
      dataPoints: '10,080 points',
      autoFetch: 'Last 7 days automatically'
    },
    { 
      value: '2m', 
      label: '2 Minutes', 
      maxPeriod: '60 days', 
      warning: 'Limited to 60 days',
      dataPoints: '43,200 points',
      autoFetch: 'Last 60 days automatically'
    },
    { 
      value: '5m', 
      label: '5 Minutes', 
      maxPeriod: '60 days', 
      warning: 'Limited to 60 days',
      dataPoints: '17,280 points',
      autoFetch: 'Last 60 days automatically'
    },
    { 
      value: '15m', 
      label: '15 Minutes', 
      maxPeriod: '60 days', 
      warning: 'Limited to 60 days',
      dataPoints: '5,760 points',
      autoFetch: 'Last 60 days automatically'
    },
    { 
      value: '30m', 
      label: '30 Minutes', 
      maxPeriod: '60 days', 
      warning: 'Limited to 60 days',
      dataPoints: '2,880 points',
      autoFetch: 'Last 60 days automatically'
    },
    { 
      value: '1h', 
      label: '1 Hour', 
      maxPeriod: '730 days', 
      warning: null,
      dataPoints: '17,520 points',
      autoFetch: 'Last 2 years automatically'
    },
    { 
      value: '1d', 
      label: '1 Day', 
      maxPeriod: 'Years', 
      warning: null,
      dataPoints: '1,825+ points',
      autoFetch: 'Last 5 years automatically'
    },
    { 
      value: '1wk', 
      label: '1 Week', 
      maxPeriod: 'Years', 
      warning: null,
      dataPoints: '260+ points',
      autoFetch: 'All available data'
    },
    { 
      value: '1mo', 
      label: '1 Month', 
      maxPeriod: 'Years', 
      warning: null,
      dataPoints: '60+ points',
      autoFetch: 'All available data'
    }
  ];

  // Updated cached data to show recent automatic fetches
  const cachedData = [
    { 
      symbol: 'EURUSD=X', 
      timeframe: '1h', 
      period: 'Last 730 days (Auto)', 
      size: '8.7 MB', 
      lastUpdate: new Date().toLocaleDateString(),
      dataPoints: '17,520',
      status: 'live'
    },
    { 
      symbol: 'GBPUSD=X', 
      timeframe: '5m', 
      period: 'Last 60 days (Auto)', 
      size: '12.3 MB', 
      lastUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString(),
      dataPoints: '17,280',
      status: 'recent'
    },
    { 
      symbol: 'USDJPY=X', 
      timeframe: '1d', 
      period: 'Last 5 years (Auto)', 
      size: '2.1 MB', 
      lastUpdate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      dataPoints: '1,825',
      status: 'recent'
    }
  ];

  const downloadData = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const selectedTf = timeframes.find(tf => tf.value === selectedTimeframe);
      
      // Simulate realistic download steps
      setDownloadProgress(10);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setDownloadProgress(30);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setDownloadProgress(60);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setDownloadProgress(85);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setDownloadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 200));

      toast({
        title: "Data Downloaded",
        description: `Fetched ${selectedSymbol.replace('=X', '')} ${selectedTimeframe} data - ${selectedTf?.dataPoints}`,
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
      {/* Automatic Data Fetch */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="h-5 w-5" />
            Automatic Data Fetch
          </CardTitle>
          <p className="text-slate-400 text-sm">Latest data fetched automatically based on timeframe</p>
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
                      <div>
                        <span>{tf.label}</span>
                        <div className="text-xs text-slate-400">{tf.autoFetch}</div>
                      </div>
                      {tf.warning && (
                        <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-400 ml-2">
                          Limited
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTimeframeData && (
              <div className="flex items-center gap-2 mt-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Zap className="h-4 w-4 text-emerald-400" />
                <div className="text-sm text-emerald-400">
                  <div className="font-medium">{selectedTimeframeData.autoFetch}</div>
                  <div className="text-xs text-emerald-300">~{selectedTimeframeData.dataPoints} available</div>
                </div>
              </div>
            )}
            {selectedTimeframeData?.warning && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-orange-500/10 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-orange-400">{selectedTimeframeData.warning}</span>
              </div>
            )}
          </div>

          {isDownloading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Fetching latest data...</span>
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
                Fetching Data...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Fetch Latest Data
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
            Available Data
          </CardTitle>
          <p className="text-slate-400 text-sm">Recently fetched market data</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cachedData.map((data, index) => (
              <div key={index} className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">
                      {data.symbol.replace('=X', '')}
                    </Badge>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {data.timeframe}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={data.status === 'live' ? 'border-emerald-500 text-emerald-400' : 'border-blue-500 text-blue-400'}
                    >
                      {data.status === 'live' ? 'Live' : 'Recent'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-sm">{data.size}</div>
                    <div className="text-xs text-slate-500">{data.dataPoints} points</div>
                  </div>
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

      {/* Data Limitations Info */}
      <div className="lg:col-span-2">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Automatic Data Periods</CardTitle>
            <p className="text-slate-400 text-sm">System automatically fetches the maximum available data for each timeframe</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="font-semibold text-white mb-2">1-Minute Data</h4>
                <p className="text-slate-400 text-sm">Automatically fetches last 7 days (10,080 data points)</p>
              </div>
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Intraday (2m-30m)</h4>
                <p className="text-slate-400 text-sm">Automatically fetches last 60 days of data</p>
              </div>
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Hourly Data</h4>
                <p className="text-slate-400 text-sm">Automatically fetches last 2 years (~17,520 points)</p>
              </div>
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Daily & Above</h4>
                <p className="text-slate-400 text-sm">Automatically fetches 5+ years of historical data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataManager;
