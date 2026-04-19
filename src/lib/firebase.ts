import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, Timestamp, Firestore } from 'firebase/firestore';

import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const DB_ID = firebaseConfig.databaseId;

export { auth, db, DB_ID, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, Timestamp, Firestore };

export interface AuthState {
  user: User | null;
  loading: boolean;
}

export const signInWithGoogle = async (): Promise<User | null> => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Sign in error:', error);
    return null;
  }
};

export const createUserDocument = async (user: User): Promise<void> => {
  if (!user) return;
  
  const userDocRef = doc(db, `users/${user.uid}`);
  const userDoc = await getDoc(userDocRef);
  
  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      memory: {},
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
};

export { app, firebaseConfig };
export default app;