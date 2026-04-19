import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, ExternalLink, Chrome } from 'lucide-react';
import { signInWithGoogle, signOut } from '../lib/firebase';
import { auth } from '../lib/firebase';
import type { User } from 'firebase/auth';

interface AuthScreenProps {
  code?: string;
  onVerified?: (user: User) => void;
}

export function AuthScreen({ code, onVerified }: AuthScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (code && user) {
      verifyCode();
    }
  }, [code, user]);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const u = await signInWithGoogle();
      if (u) {
        setUser(u);
      }
    } catch (err) {
      setError('Failed to sign in');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setVerified(false);
  };

  const verifyCode = async () => {
    if (!code || !user) return;
    
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, uid: user.uid }),
      });
      
      if (response.ok) {
        setVerified(true);
        onVerified?.(user);
      }
    } catch (err) {
      console.error('Verification error:', err);
    }
  };

  if (code && user && !verified) {
    return (
      <div className="min-h-screen bg-cipher-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-cipher-card border border-cipher-border rounded-lg p-8"
        >
          <h1 className="text-2xl font-bold font-mono text-white mb-2">Confirm Link</h1>
          <p className="text-cipher-muted font-mono text-sm mb-6">
            Click to confirm linking your CLI session to your account.
          </p>
          
          <div className="text-center">
            <Loader2 className="animate-spin w-8 h-8 text-cipher-accent mx-auto mb-4" />
            <p className="text-cipher-muted font-mono text-sm">Confirming...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (code && user && verified) {
    return (
      <div className="min-h-screen bg-cipher-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-cipher-card border border-cipher-border rounded-lg p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check className="w-8 h-8 text-green-500" />
          </motion.div>
          <h1 className="text-2xl font-bold font-mono text-white mb-2">Linked!</h1>
          <p className="text-cipher-muted font-mono text-sm mb-6">
            Your CLI session is now linked to your account.
          </p>
          <p className="text-xs text-cipher-muted font-mono">
            Return to your terminal to continue.
          </p>
        </motion.div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-cipher-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-cipher-card border border-cipher-border rounded-lg p-8"
        >
          <h1 className="text-2xl font-bold font-mono text-white mb-2">Signed In</h1>
          <p className="text-cipher-muted font-mono text-sm mb-6">
            You are signed in as {user.email}
          </p>
          
          <div className="flex items-center gap-4 mb-6">
            {user.photoURL && (
              <img src={user.photoURL} alt="Avatar" className="w-12 h-12 rounded-full" />
            )}
            <div>
              <p className="text-white font-mono">{user.displayName}</p>
              <p className="text-cipher-muted font-mono text-sm">{user.email}</p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full py-3 bg-cipher-dark border border-cipher-border rounded-lg text-white font-mono text-sm hover:bg-cipher-border transition-colors"
          >
            Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cipher-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-cipher-card border border-cipher-border rounded-lg p-8"
      >
        <h1 className="text-2xl font-bold font-mono text-white mb-1">Cipher</h1>
        <p className="text-cipher-muted font-mono text-sm mb-6">Neural Synthesis</p>
        
        {code && (
          <div className="mb-6 p-4 bg-cipher-dark border border-cipher-border rounded-lg">
            <p className="text-xs text-cipher-muted font-mono mb-2">Link Code</p>
            <p className="text-3xl font-bold font-mono text-white tracking-wider">{code}</p>
            <p className="text-xs text-cipher-muted font-mono mt-2">
              Sign in to confirm device link
            </p>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 font-mono text-sm">
            {error}
          </div>
        )}
        
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full py-3 bg-cipher-accent hover:bg-cipher-accent-hover rounded-lg text-white font-mono text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Chrome className="w-5 h-5" />
              Sign in with Google
            </>
          )}
        </button>
        
        <p className="text-xs text-cipher-muted font-mono mt-6 text-center">
          By signing in, you agree to sync your data across devices
        </p>
      </motion.div>
    </div>
  );
}

export default AuthScreen;