import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from 'firebase/auth';

export interface SyncState {
  code: string | null;
  status: 'idle' | 'pending' | 'verifying' | 'verified' | 'expired';
  user: { uid: string; apiKey: string } | null;
}

export function useSync() {
  const [state, setState] = useState<SyncState>({
    code: null,
    status: 'idle',
    user: null,
  });
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const generateCode = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate code');
      }

      const data = await response.json();
      setState((prev) => ({
        ...prev,
        code: data.code,
        status: 'pending',
      }));
    } catch (error) {
      console.error('Generate code error:', error);
      setState((prev) => ({ ...prev, status: 'expired' }));
    }
  }, []);

  const pollForVerification = useCallback(async () => {
    if (!state.code || state.status !== 'pending') return;

    const poll = async () => {
      try {
        const response = await fetch(`/api/auth/verify?code=${state.code}`);
        
        if (!response.ok) {
          throw new Error('Poll failed');
        }

        const data = await response.json();
        
        if (data.status === 'verified' && data.uid && data.apiKey) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          
          setState((prev) => ({
            ...prev,
            status: 'verified',
            user: { uid: data.uid, apiKey: data.apiKey },
          }));
        } else if (data.status === 'expired') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          
          setState((prev) => ({ ...prev, status: 'expired' }));
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    };

    pollingRef.current = setInterval(poll, 2000);
    poll();
  }, [state.code, state.status]);

  const verifyCode = useCallback(async (code: string, uid: string) => {
    try {
      setState((prev) => ({ ...prev, status: 'verifying' }));
      
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, uid }),
      });
      
      if (!response.ok) {
        throw new Error('Verification failed');
      }
      
      setState((prev) => ({ ...prev, status: 'verified' }));
    } catch (error) {
      console.error('Verify error:', error);
      setState((prev) => ({ ...prev, status: 'expired' }));
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (state.code && state.status === 'pending') {
      pollForVerification();
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [state.code, state.status, pollForVerification]);

  return {
    ...state,
    generateCode,
    verifyCode,
    stopPolling,
  };
}

export default useSync;