'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser,
  getIdTokenResult,
  getIdToken
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContextType, User } from '@/lib/auth-types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idTokenResult = await fbUser.getIdTokenResult();
          const role = (idTokenResult.claims.role as 'USER' | 'ADMIN') || 'USER';
          
          const mappedUser: User = {
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            avatar: fbUser.photoURL || undefined,
            role: role,
            createdAt: new Date(fbUser.metadata.creationTime || Date.now()),
          };

          setUser(mappedUser);

          // Fetch System Settings from Backend
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
          if (backendUrl) {
            const token = await fbUser.getIdToken();
            const meRes = await fetch(`${backendUrl}/api/me`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const meData = await meRes.json();
            setSettings(meData.settings);

            if (meData.settings?.maintenanceMode && role !== 'ADMIN' && pathname !== '/maintenance' && !pathname.startsWith('/admin')) {
              router.push('/maintenance');
            }
          }
        } catch (e) {
          console.error('Initial Load Error:', e);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const loginWithGoogle = async () => {
    if (loginLoading) return;
    setLoginLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error('Login failed', error);
      throw error;
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getToken = async () => {
    if (!auth.currentUser) return null;
    return await getIdToken(auth.currentUser);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginWithGoogle,
    logout,
    getToken,
    isAdmin: user?.role === 'ADMIN',
    settings,
    loginLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
