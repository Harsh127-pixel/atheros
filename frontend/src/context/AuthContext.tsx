'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User,
  getIdToken,
  getIdTokenResult
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface UserWithRole extends User {
  role?: string;
}

interface AuthContextType {
  user: UserWithRole | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idTokenResult = await getIdTokenResult(fbUser);
          setUser({ 
            ...fbUser, 
            role: (idTokenResult.claims.role as string) || 'USER' 
          });
        } catch (e) {
          console.error('Failed to get token result:', e);
          setUser(fbUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
      throw error;
    }
  };

  const getToken = async () => {
    if (!auth.currentUser) return null;
    return await getIdToken(auth.currentUser);
  };

  const isAdmin = user?.role === 'ADMIN' || user?.email === 'admin@aetheros.com';

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, getToken, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
