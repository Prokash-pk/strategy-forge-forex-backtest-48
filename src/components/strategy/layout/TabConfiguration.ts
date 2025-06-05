
import { Settings, Code2, Bookmark, Lightbulb, TrendingUp, Cpu, BarChart3 } from 'lucide-react';

export interface TabItem {
  value: string;
  icon: any;
  label: string;
  shortLabel: string;
}

export const TAB_ITEMS: TabItem[] = [
  {
    value: 'configuration',
    icon: Settings,
    label: 'Configuration',
    shortLabel: 'Config'
  },
  {
    value: 'python',
    icon: Code2,
    label: 'Python Code',
    shortLabel: 'Code'
  },
  {
    value: 'saved',
    icon: Bookmark,
    label: 'Saved Strategies',
    shortLabel: 'Saved'
  },
  {
    value: 'visual',
    icon: Cpu,
    label: 'Visual Builder',
    shortLabel: 'Visual'
  },
  {
    value: 'recommendations',
    icon: Lightbulb,
    label: 'AI Recommendations',
    shortLabel: 'AI'
  },
  {
    value: 'mt4',
    icon: TrendingUp,
    label: 'MT4 Trading',
    shortLabel: 'MT4'
  },
  {
    value: 'oanda',
    icon: TrendingUp,
    label: 'OANDA Trading',
    shortLabel: 'OANDA'
  },
  {
    value: 'interactive-brokers',
    icon: BarChart3,
    label: 'Interactive Brokers',
    shortLabel: 'IB'
  }
];
