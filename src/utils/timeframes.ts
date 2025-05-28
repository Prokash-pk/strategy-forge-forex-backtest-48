
import { TimeframeInfo } from '@/types/backtest';

export const timeframes: TimeframeInfo[] = [
  { value: '1m', label: '1 Minute', period: '7 days', dataPoints: 10080, minutesPerBar: 1 },
  { value: '5m', label: '5 Minutes', period: '60 days', dataPoints: 17280, minutesPerBar: 5 },
  { value: '15m', label: '15 Minutes', period: '60 days', dataPoints: 5760, minutesPerBar: 15 },
  { value: '1h', label: '1 Hour', period: '730 days', dataPoints: 17520, minutesPerBar: 60 },
  { value: '1d', label: '1 Day', period: '5 years', dataPoints: 1825, minutesPerBar: 1440 }
];

export const getTimeframeInfo = (timeframe: string): TimeframeInfo | undefined => {
  return timeframes.find(tf => tf.value === timeframe);
};
