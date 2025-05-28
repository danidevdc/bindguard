"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const RXLOCAL_USERS_KEY = 'rxlocal_users'; // Stores array of {username, password}
const RXLOCAL_CURRENT_USER_KEY = 'rxlocal_currentUser'; // Stores username of logged-in user

interface UserCredentials {
  username: string;
  password?: string; // Password stored for simplicity, hash in real app
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedCurrentUser = localStorage.getItem(RXLOCAL_CURRENT_USER_KEY);
      if (storedCurrentUser) {
        setIsAuthenticated(true);
        setCurrentUser(storedCurrentUser);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } catch (error) {
      console.warn('localStorage not available for auth check, defaulting to unauthenticated.');
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
    setIsLoading(false);
  }, []);

  const getUsers = (): UserCredentials[] => {
    try {
      const usersJson = localStorage.getItem(RXLOCAL_USERS_KEY);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.warn('Error reading users from localStorage', error);
      return [];
    }
  };

  const saveUsers = (users: UserCredentials[]) => {
    try {
      localStorage.setItem(RXLOCAL_USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.warn('Error saving users to localStorage', error);
    }
  };

  const login = useCallback(async (username?: string, password?: string) => {
    setIsLoading(true);
    if (!username || !password) {
      toast({ title: "Error", description: "Usuario o contraseña inválidos.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      localStorage.setItem(RXLOCAL_CURRENT_USER_KEY, user.username);
      setIsAuthenticated(true);
      setCurrentUser(user.username);
      toast({ title: "Inicio de Sesión Exitoso", description: `¡Bienvenido de nuevo, ${user.username}!` });
      router.push('/dashboard');
    } else {
      toast({ title: "Error de Inicio de Sesión", description: "Credenciales incorrectas. Inténtalo de nuevo.", variant: "destructive" });
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
    setIsLoading(false);
  }, [router, toast]);

  const register = useCallback(async (username?: string, password?: string) => {
    setIsLoading(true);
    if (!username || !password) {
      toast({ title: "Error de Registro", description: "Usuario y contraseña son requeridos.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const users = getUsers();
    if (users.find(u => u.username === username)) {
      toast({ title: "Error de Registro", description: "Este nombre de usuario ya existe.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const newUser: UserCredentials = { username, password };
    saveUsers([...users, newUser]);
    
    toast({ title: "Registro Exitoso", description: `Cuenta creada para ${username}. Ahora puedes iniciar sesión.` });
    // Automatically log in the user after registration
    await login(username, password);
    // router.push('/login'); // Or redirect to dashboard if auto-login
    setIsLoading(false);
  }, [toast, login]);

  const logout = useCallback(() => {
    localStorage.removeItem(RXLOCAL_CURRENT_USER_KEY);
    setIsAuthenticated(false);
    setCurrentUser(null);
    router.push('/login');
    toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
  }, [router, toast]);

  const getCurrentUser = useCallback(() => {
    try {
      return localStorage.getItem(RXLOCAL_CURRENT_USER_KEY);
    } catch (error) {
      return null;
    }
  }, []);


  return { isAuthenticated, isLoading, currentUser, login, register, logout, getCurrentUser };
}
