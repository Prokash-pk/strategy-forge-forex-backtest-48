
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi } from 'lucide-react';
import ConnectionTestButton from './connection-tester/ConnectionTestButton';
import ConnectionResultDisplay from './connection-tester/ConnectionResultDisplay';
import ConnectionTesterInfo from './connection-tester/ConnectionTesterInfo';
import { useConnectionTester } from './connection-tester/useConnectionTester';

interface OANDAConnectionTesterProps {
  config: {
    accountId: string;
    apiKey: string;
    environment: 'practice' | 'live';
  };
}

const OANDAConnectionTester: React.FC<OANDAConnectionTesterProps> = ({ config }) => {
  const {
    isTestingConnection,
    connectionResult,
    lastTestTime,
    testOANDAConnection
  } = useConnectionTester();

  const isDisabled = !config.accountId || !config.apiKey;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Wifi className="h-5 w-5" />
          OANDA Connection Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <ConnectionTestButton
            onTest={() => testOANDAConnection(config)}
            isLoading={isTestingConnection}
            isDisabled={isDisabled}
          />

          {lastTestTime && (
            <span className="text-sm text-slate-400">
              Last tested: {lastTestTime}
            </span>
          )}
        </div>

        {connectionResult && (
          <ConnectionResultDisplay result={connectionResult} />
        )}

        <ConnectionTesterInfo />
      </CardContent>
    </Card>
  );
};

export default OANDAConnectionTester;
