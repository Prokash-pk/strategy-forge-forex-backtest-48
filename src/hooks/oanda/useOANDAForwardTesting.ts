
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';

export const useOANDAForwardTesting = (strategy: any, config: any) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isForwardTestingActive, setIsForwardTestingActive] = useState(false);
  const [hasServerSession, setHasServerSession] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing server sessions on mount
  useEffect(() => {
    if (user) {
      checkExistingServerSessions();
    }
  }, [user]);

  const checkExistingServerSessions = async () => {
    try {
      const sessions = await ServerForwardTestingService.getActiveSessions();
      const hasActive = sessions.length > 0;
      setHasServerSession(hasActive);
      
      if (hasActive) {
        console.log(`✅ Found ${sessions.length} active server-side trading sessions`);
      }
    } catch (error) {
      console.error('Failed to check server sessions:', error);
    }
  };

  const startForwardTesting = async () => {
    if (!strategy || !config || !user) {
      toast({
        title: "⚠️ Configuration Required",
        description: "Please ensure strategy and OANDA connection are configured",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('🚀 Starting hybrid forward testing (browser + server)...');
      
      // Start server-side trading session
      const session = await ServerForwardTestingService.startServerSideForwardTesting(
        strategy, 
        config, 
        user.id
      );
      
      console.log('✅ Server-side session created:', session);
      setHasServerSession(true);
      
      // Start browser-based monitoring
      setIsForwardTestingActive(true);
      startBrowserMonitoring();
      
      toast({
        title: "🚀 Forward Testing Started!",
        description: "Both browser monitoring and 24/7 server trading are now active",
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to start forward testing:', error);
      toast({
        title: "❌ Failed to Start",
        description: error instanceof Error ? error.message : "Could not start forward testing",
        variant: "destructive",
      });
      return false;
    }
  };

  const stopForwardTesting = async () => {
    try {
      console.log('⏹️ Stopping forward testing...');

      // Stop server-side sessions
      if (user) {
        await ServerForwardTestingService.stopServerSideForwardTesting(user.id);
        setHasServerSession(false);
      }

      // Stop browser monitoring
      stopBrowserMonitoring();
      setIsForwardTestingActive(false);

      toast({
        title: "⏹️ Forward Testing Stopped",
        description: "Both browser monitoring and server trading have been stopped",
      });

    } catch (error) {
      console.error('❌ Failed to stop forward testing:', error);
      toast({
        title: "❌ Failed to Stop",
        description: "There was an error stopping forward testing",
        variant: "destructive",
      });
    }
  };

  const startBrowserMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Browser-based monitoring every 60 seconds
    intervalRef.current = setInterval(async () => {
      try {
        console.log('🔍 Browser monitoring check...');
        
        // This could include additional client-side monitoring
        // For now, just log that monitoring is active
        await checkExistingServerSessions();
        
      } catch (error) {
        console.error('Browser monitoring error:', error);
      }
    }, 60000);

    console.log('✅ Browser monitoring started');
  };

  const stopBrowserMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏹️ Browser monitoring stopped');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBrowserMonitoring();
    };
  }, []);

  const toggleForwardTesting = async () => {
    if (isForwardTestingActive || hasServerSession) {
      await stopForwardTesting();
    } else {
      return await startForwardTesting();
    }
  };

  return {
    isForwardTestingActive: isForwardTestingActive || hasServerSession,
    hasServerSession,
    startForwardTesting,
    stopForwardTesting,
    toggleForwardTesting,
    checkExistingServerSessions
  };
};
