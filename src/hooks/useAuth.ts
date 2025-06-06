
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const RXLOCAL_USERS_KEY = 'rxlocal_users_v2'; // Stores array of {username, password, firstName, lastName}
const RXLOCAL_CURRENT_USER_KEY = 'rxlocal_currentUser_v2'; // Stores username (nombre.apellido) of logged-in user

interface UserData {
  username: string; // nombre.apellido
  password?: string;
  firstName: string;
  lastName: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null); // Stores username: nombre.apellido
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedCurrentUserUsername = localStorage.getItem(RXLOCAL_CURRENT_USER_KEY);
      if (storedCurrentUserUsername) {
        setIsAuthenticated(true);
        setCurrentUser(storedCurrentUserUsername);
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

  const getUsers = (): UserData[] => {
    try {
      const usersJson = localStorage.getItem(RXLOCAL_USERS_KEY);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.warn('Error reading users from localStorage', error);
      return [];
    }
  };

  const saveUsers = (users: UserData[]) => {
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
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    if (user) {
      localStorage.setItem(RXLOCAL_CURRENT_USER_KEY, user.username);
      setIsAuthenticated(true);
      setCurrentUser(user.username);
      const capitalizedFirstName = user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase();
      toast({ title: "Inicio de Sesión Exitoso", description: `¡Bienvenido de nuevo, ${capitalizedFirstName}!` });
      router.push('/dashboard');
    } else {
      toast({ title: "Error de Inicio de Sesión", description: "Credenciales incorrectas. Inténtalo de nuevo.", variant: "destructive" });
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
    setIsLoading(false);
  }, [router, toast]);

  const register = useCallback(async (firstName?: string, lastName?: string, password?: string) => {
    setIsLoading(true);
    if (!firstName || !lastName || !password) {
      toast({ title: "Error de Registro", description: "Nombre, apellido y contraseña son requeridos.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const generatedUsername = `${firstName.trim().toLowerCase()}.${lastName.trim().toLowerCase()}`;
    const users = getUsers();

    if (users.find(u => u.username.toLowerCase() === generatedUsername.toLowerCase())) {
      toast({ title: "Error de Registro", description: "Este usuario (combinación nombre/apellido) ya existe.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const newUser: UserData = { 
      username: generatedUsername, 
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim()
    };
    saveUsers([...users, newUser]);
    
    const capitalizedFirstName = newUser.firstName.charAt(0).toUpperCase() + newUser.firstName.slice(1).toLowerCase();
    toast({ title: "Registro Exitoso", description: `Cuenta creada para ${capitalizedFirstName}. Ahora puedes iniciar sesión con el usuario: ${newUser.username}` });
    await login(newUser.username, password); // Auto-login after registration
    setIsLoading(false);
  }, [toast, login]);

  const logout = useCallback(() => {
    localStorage.removeItem(RXLOCAL_CURRENT_USER_KEY);
    setIsAuthenticated(false);
    setCurrentUser(null);
    router.push('/login');
    toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
  }, [router, toast]);

  const getCurrentUserUsername = useCallback((): string | null => {
    try {
      return localStorage.getItem(RXLOCAL_CURRENT_USER_KEY);
    } catch (error) {
      return null;
    }
  }, []);
  
  // Helper function to get full user details, not used externally by components directly yet
  // but useful for internal logic or future expansion.
  const getCurrentUserDetails = useCallback((): UserData | null => {
    const username = getCurrentUserUsername();
    if (!username) return null;
    const users = getUsers();
    return users.find(u => u.username === username) || null;
  }, [getCurrentUserUsername]);


  return { isAuthenticated, isLoading, currentUser, login, register, logout, getCurrentUserUsername, getCurrentUserDetails };
}
