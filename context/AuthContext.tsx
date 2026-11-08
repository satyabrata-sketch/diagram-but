'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SessionUser } from '@/lib/types';

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'diagram_but_user_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load session from localStorage on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SessionUser;
        if (parsed && parsed.id && parsed.username) {
          setUser(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to parse user session from localStorage', err);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  // Protect routes - redirect to /login if not authenticated
  useEffect(() => {
    if (loading) return;

    const isAuthRoute = pathname === '/login';

    if (!user && !isAuthRoute) {
      router.replace('/login');
    } else if (user && isAuthRoute) {
      router.replace('/dashboard');
    }
  }, [user, loading, pathname, router]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.user));
        return { success: true };
      }

      return { success: false, error: 'Unexpected login response' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error during login';
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
