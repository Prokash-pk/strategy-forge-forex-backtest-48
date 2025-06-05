
import React from 'react';
import { Eye } from 'lucide-react';

const AutoTesterInfoBox: React.FC = () => {
  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <Eye className="h-4 w-4 text-blue-400 mt-0.5" />
        <div>
          <p className="text-blue-300 text-sm font-medium">
            Console Monitoring Active
          </p>
          <p className="text-blue-400 text-xs mt-1">
            Open your browser's Developer Tools (F12) and check the Console tab to see detailed strategy testing logs including:
          </p>
          <ul className="text-blue-400 text-xs mt-2 space-y-1 ml-4">
            <li>• Live market data (OHLCV candles)</li>
            <li>• Strategy signal detection (BUY/SELL)</li>
            <li>• Technical indicator values (RSI, EMA, MACD)</li>
            <li>• Signal confidence levels</li>
            <li>• Real-time trade opportunities</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AutoTesterInfoBox;
