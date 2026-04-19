import { useState, useEffect, useCallback } from 'react';
import { auth, db, doc, getDoc, setDoc, Timestamp } from '../lib/firebase';
import type { User } from 'firebase/auth';

export interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, `users/${user.uid}`));
        if (!userDoc.exists()) {
          await setDoc(doc(db, `users/${user.uid}`), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            memory: {},
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }
      }
      setState({ user, loading: false });
    });
    return unsubscribe;
  }, []);

  return state;
}

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('cipher_api_key');
    if (stored) {
      setApiKey(stored);
    }
  }, []);

  const saveApiKey = useCallback((key: string) => {
    localStorage.setItem('cipher_api_key', key);
    setApiKey(key);
  }, []);

  return { apiKey, saveApiKey };
}

export default useAuth;