"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AUTH_KEY = 'rxlocal_auth_status';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const authStatus = localStorage.getItem(AUTH_KEY);
      setIsAuthenticated(authStatus === 'true');
    } catch (error) {
      // localStorage might not be available (e.g. SSR, or disabled)
      console.warn('localStorage not available for auth check, defaulting to unauthenticated.');
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((username?: string, password?: string) => {
    // Mock login: In a real app, validate credentials against a backend.
    // For this demo, any username/password will work.
    if (username && password) {
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      router.push('/dashboard');
    } else {
      // Handle case where username/password might be empty if needed
      setIsAuthenticated(false); // Or show an error
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    router.push('/login');
  }, [router]);

  return { isAuthenticated, isLoading, login, logout };
}
