
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Wifi, Bug } from 'lucide-react';

interface ConnectionTestButtonProps {
  onTest: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

const ConnectionTestButton: React.FC<ConnectionTestButtonProps> = ({
  onTest,
  isLoading,
  isDisabled
}) => {
  const handleTestWithLogs = () => {
    console.log('🧪 Connection test button clicked');
    console.log('🔍 Current timestamp:', new Date().toISOString());
    
    // Check if we have access to localStorage config
    const savedConfig = localStorage.getItem('oanda_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        console.log('💾 Saved config found:', {
          hasAccountId: !!config.accountId,
          hasApiKey: !!config.apiKey,
          apiKeyLength: config.apiKey?.length || 0,
          environment: config.environment
        });
      } catch (error) {
        console.error('❌ Error parsing saved config:', error);
      }
    } else {
      console.log('⚠️ No saved config found in localStorage');
    }
    
    onTest();
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleTestWithLogs}
        disabled={isLoading || isDisabled}
        className="bg-blue-600 hover:bg-blue-700 w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Testing Connection...
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4 mr-2" />
            Test Live Connection
          </>
        )}
      </Button>
      
      <Button
        onClick={() => {
          console.log('🔍 DEBUG: Current localStorage state:');
          console.log('💾 oanda_config:', localStorage.getItem('oanda_config'));
          console.log('🔗 oanda_connection:', localStorage.getItem('oanda_connection'));
          console.log('🌐 Current URL:', window.location.href);
          console.log('📱 User agent:', navigator.userAgent);
        }}
        variant="outline"
        size="sm"
        className="w-full text-xs"
      >
        <Bug className="h-3 w-3 mr-1" />
        Debug Info
      </Button>
    </div>
  );
};

export default ConnectionTestButton;
