
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const RXLOCAL_USERS_KEY = 'rxlocal_users_v2'; 
const RXLOCAL_CURRENT_USER_KEY = 'rxlocal_currentUser_v2'; 

interface UserData {
  username: string; 
  password?: string;
  firstName: string;
  lastName: string;
  isAdmin?: boolean; 
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null); 
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const initializeDefaultAdmin = (users: UserData[]): UserData[] => {
    const adminExists = users.some(u => u.username === 'admin.admin');
    if (!adminExists) {
      const adminUser: UserData = {
        username: 'admin.admin',
        password: 'admin123', 
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true,
      };
      users.push(adminUser);
      console.log("Default admin user created.");
    }
    return users;
  };

  const getUsers = (): UserData[] => {
    try {
      let usersJson = localStorage.getItem(RXLOCAL_USERS_KEY);
      let users: UserData[] = usersJson ? JSON.parse(usersJson) : [];
      
      // Ensure default admin exists
      if (users.length === 0) { // Or any other logic to ensure admin is created once
         users = initializeDefaultAdmin(users);
         saveUsers(users); // Save back if admin was added
      } else {
        // Check if admin exists if users array is not empty but could have been cleared partially
        const adminExists = users.some(u => u.username === 'admin.admin');
        if (!adminExists) {
            users = initializeDefaultAdmin(users);
            saveUsers(users);
        }
      }
      return users;
    } catch (error) {
      console.warn('Error reading users from localStorage', error);
      // Attempt to re-initialize if error occurs, e.g., corrupted data
      let users: UserData[] = [];
      users = initializeDefaultAdmin(users);
      saveUsers(users);
      return users;
    }
  };

  const saveUsers = (users: UserData[]) => {
    try {
      localStorage.setItem(RXLOCAL_USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.warn('Error saving users to localStorage', error);
    }
  };

  useEffect(() => {
    // Ensure users (and admin) are initialized on load
    getUsers(); 

    try {
      const storedCurrentUserUsername = localStorage.getItem(RXLOCAL_CURRENT_USER_KEY);
      if (storedCurrentUserUsername) {
        const users = getUsers(); // Get users again to check admin status
        const loggedInUser = users.find(u => u.username === storedCurrentUserUsername);
        if (loggedInUser) {
            setIsAuthenticated(true);
            setCurrentUser(loggedInUser.username);
            setIsCurrentUserAdmin(!!loggedInUser.isAdmin);
        } else {
            // User in localStorage but not in users list (edge case, e.g. users cleared)
            logout(); // Force logout
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsCurrentUserAdmin(false);
      }
    } catch (error) {
      console.warn('localStorage not available for auth check, defaulting to unauthenticated.');
      setIsAuthenticated(false);
      setCurrentUser(null);
      setIsCurrentUserAdmin(false);
    }
    setIsLoading(false);
  }, []);

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
      setIsCurrentUserAdmin(!!user.isAdmin);
      const capitalizedFirstName = user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase();
      toast({ title: "Inicio de Sesión Exitoso", description: `¡Bienvenido de nuevo, ${capitalizedFirstName}!` });
      router.push('/dashboard');
    } else {
      toast({ title: "Error de Inicio de Sesión", description: "Credenciales incorrectas. Inténtalo de nuevo.", variant: "destructive" });
      setIsAuthenticated(false);
      setCurrentUser(null);
      setIsCurrentUserAdmin(false);
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
      lastName: lastName.trim(),
      isAdmin: false, // New users are not admins by default
    };
    saveUsers([...users, newUser]);
    
    const capitalizedFirstName = newUser.firstName.charAt(0).toUpperCase() + newUser.firstName.slice(1).toLowerCase();
    toast({ title: "Registro Exitoso", description: `Cuenta creada para ${capitalizedFirstName}. Ahora puedes iniciar sesión con el usuario: ${newUser.username}` });
    await login(newUser.username, password); 
    setIsLoading(false);
  }, [toast, login]);

  const logout = useCallback(() => {
    localStorage.removeItem(RXLOCAL_CURRENT_USER_KEY);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsCurrentUserAdmin(false);
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
  
  const getCurrentUserDetails = useCallback((): UserData | null => {
    const username = getCurrentUserUsername();
    if (!username) return null;
    const users = getUsers();
    return users.find(u => u.username === username) || null;
  }, [getCurrentUserUsername]);


  return { isAuthenticated, isLoading, currentUser, isCurrentUserAdmin, login, register, logout, getCurrentUserUsername, getCurrentUserDetails };
}
