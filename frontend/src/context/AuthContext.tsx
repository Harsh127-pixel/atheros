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
import { useRouter, usePathname } from 'next/navigation';

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
  settings: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idTokenResult = await fbUser.getIdTokenResult();
          const role = (idTokenResult.claims.role as string) || 'USER';
          
          setUser({ ...fbUser, role });

          // Fetch System Settings from Backend
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
          const token = await fbUser.getIdToken();
          const meRes = await fetch(`${backendUrl}/api/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const meData = await meRes.json();
          
          setSettings(meData.settings);

          if (meData.settings?.maintenanceMode && role !== 'ADMIN' && pathname !== '/maintenance' && !pathname.startsWith('/admin')) {
            router.push('/maintenance');
          }
           else if (!meData.settings?.maintenanceMode && pathname === '/maintenance') {
            router.push('/');
          }
        } catch (e) {
          console.error('Initial Load Error:', e);
          setUser(fbUser);
        }
      } else {
        setUser(null);
        // Also fetch settings for non-logged in users if possible, or just default
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

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

  const isAdmin = user?.role === 'ADMIN' || user?.email === 'admin@gaurangjadoun.in';

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, getToken, isAdmin, settings }}>
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
