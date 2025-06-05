
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AutoTesterConfigProps {
  testInterval: number;
  onTestIntervalChange: (value: number) => void;
  testCount: number;
  isTestingActive: boolean;
}

const AutoTesterConfig: React.FC<AutoTesterConfigProps> = ({
  testInterval,
  onTestIntervalChange,
  testCount,
  isTestingActive
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="test-interval" className="text-white">Test Interval (seconds)</Label>
          <Input
            id="test-interval"
            type="number"
            value={testInterval}
            onChange={(e) => onTestIntervalChange(Number(e.target.value))}
            min={10}
            max={300}
            disabled={isTestingActive}
            className="bg-slate-700 border-slate-600 text-white"
          />
          <p className="text-xs text-slate-400">How often to test strategy signals</p>
        </div>
        
        <div className="space-y-2">
          <Label className="text-white">Test Statistics</Label>
          <div className="bg-slate-700/50 p-3 rounded">
            <div className="text-sm text-slate-300">
              Total Tests: {testCount}
            </div>
            <div className="text-xs text-slate-400">
              Status: {isTestingActive ? 'Running' : 'Stopped'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoTesterConfig;
