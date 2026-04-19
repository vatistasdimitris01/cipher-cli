import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AuthScreen } from './components/AuthScreen';
import { useAuth } from './hooks/useAuth';
import type { User } from 'firebase/auth';

export function Auth() {
  const { user, loading } = useAuth();
  const [code] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code');
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-cipher-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-cipher-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (code && !user) {
    return <AuthScreen code={code} />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return null;
}

export default Auth;