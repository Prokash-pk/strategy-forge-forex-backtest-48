
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface SavedConfig {
  id: string;
  config_name: string;
  account_id: string;
  environment: string;
}

interface OANDASavedConfigsProps {
  savedConfigs: SavedConfig[];
  onLoadConfig: (config: SavedConfig) => void;
}

const OANDASavedConfigs: React.FC<OANDASavedConfigsProps> = ({
  savedConfigs,
  onLoadConfig
}) => {
  if (savedConfigs.length === 0) {
    return null;
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Upload className="h-5 w-5" />
          Saved API Configurations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {savedConfigs.map((savedConfig) => (
          <div key={savedConfig.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
            <div>
              <h4 className="text-white font-medium">{savedConfig.config_name}</h4>
              <p className="text-slate-400 text-sm">
                {savedConfig.environment} • Account: {savedConfig.account_id.slice(-8)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLoadConfig(savedConfig)}
              className="border-slate-600 text-slate-300 hover:text-white"
            >
              Load
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default OANDASavedConfigs;
