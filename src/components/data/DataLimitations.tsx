
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DataLimitations = () => {
  return (
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
  );
};

export default DataLimitations;
