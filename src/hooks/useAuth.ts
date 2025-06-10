
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  where,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { initializeDefaultMedicines, mockMedicinesForFirestore, type Medicine as MedicineData } from '@/lib/medicineService';


const RXLOCAL_CURRENT_USER_USERNAME_KEY = 'rxlocal_currentUser_username_v3';

export interface UserData {
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
  createdAt?: Timestamp;
  firestoreId?: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchUserDetails = useCallback(async (username: string): Promise<UserData | null> => {
    if (!db) {
      console.error("Firestore instance (db) is not available for fetching user details.");
      toast({ title: 'Error de Configuración', description: 'La base de datos no está inicializada.', variant: 'destructive' });
      return null;
    }
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { firestoreId: userDoc.id, ...userDoc.data() } as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user details from Firestore:', error);
      toast({ title: 'Error de Red', description: 'No se pudieron obtener los detalles del usuario. Verifica tu conexión y las reglas de Firestore.', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const initializeDefaultAdminAndData = useCallback(async () => {
    if (!db) {
      console.error("Firestore instance (db) is not available for admin/data initialization.");
      return;
    }
    try {
      // Initialize Admin User
      const usersRef = collection(db, 'users');
      const adminQuery = query(usersRef, where('username', '==', 'admin.admin'));
      const adminSnapshot = await getDocs(adminQuery);

      if (adminSnapshot.empty) {
        const adminUser: Omit<UserData, 'firestoreId'> = {
          username: 'admin.admin',
          password: 'admin123',
          firstName: 'Admin',
          lastName: 'BindGuard',
          isAdmin: true,
          createdAt: serverTimestamp() as Timestamp,
        };
        await setDoc(doc(usersRef, 'admin.admin'), adminUser);
        console.log('Default admin user "admin.admin" created in Firestore.');
      }

      // Initialize Default Medicines
      await initializeDefaultMedicines();

    } catch (error) {
      console.error('Error initializing default admin or mock medicines:', error);
      toast({ title: 'Error de Inicialización del Sistema', description: 'No se pudo configurar el administrador o datos iniciales.', variant: 'destructive' });
    }
  }, [toast]);

  const checkUserSessionAndAdmin = useCallback(async () => {
    setIsLoading(true);
    if (!db) {
        console.warn("Firestore not available during session check. App may not function correctly.");
        setIsLoading(false);
        return;
    }
    await initializeDefaultAdminAndData();

    try {
      const storedUsername = localStorage.getItem(RXLOCAL_CURRENT_USER_USERNAME_KEY);
      if (storedUsername) {
        const userDetails = await fetchUserDetails(storedUsername);
        if (userDetails) {
          setCurrentUser(userDetails);
          setIsAuthenticated(true);
          setIsCurrentUserAdmin(!!userDetails.isAdmin);
        } else {
          localStorage.removeItem(RXLOCAL_CURRENT_USER_USERNAME_KEY);
          setCurrentUser(null);
          setIsAuthenticated(false);
          setIsCurrentUserAdmin(false);
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setIsCurrentUserAdmin(false);
      }
    } catch (error) {
      console.error("Error during user session check:", error);
      setCurrentUser(null);
      setIsAuthenticated(false);
      setIsCurrentUserAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserDetails, initializeDefaultAdminAndData]);


  useEffect(() => {
    if (db) {
        checkUserSessionAndAdmin();
    } else {
        console.warn("useAuth useEffect: Firestore db not ready yet. Retrying or check initialization.");
        setIsLoading(false);
         toast({ title: 'Error de Configuración', description: 'La base de datos no está lista. Por favor, refresca la página.', variant: 'destructive' });
    }
  }, [checkUserSessionAndAdmin]);


  const login = useCallback(async (usernameInput?: string, passwordInput?: string) => {
    setIsLoading(true);
    if (!db) {
      toast({ title: 'Error de Configuración', description: 'La base de datos no está disponible.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    if (!usernameInput || !passwordInput) {
      toast({ title: "Error", description: "Usuario y contraseña son requeridos.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const userDetails = await fetchUserDetails(usernameInput);

      if (userDetails && userDetails.password === passwordInput) {
        localStorage.setItem(RXLOCAL_CURRENT_USER_USERNAME_KEY, userDetails.username);
        setCurrentUser(userDetails);
        setIsAuthenticated(true);
        setIsCurrentUserAdmin(!!userDetails.isAdmin);
        const capitalizedFirstName = userDetails.firstName.charAt(0).toUpperCase() + userDetails.firstName.slice(1).toLowerCase();
        toast({ title: "Inicio de Sesión Exitoso", description: `¡Bienvenido de nuevo, ${capitalizedFirstName}!` });
        router.push('/dashboard');
      } else {
        toast({ title: "Error de Inicio de Sesión", description: "Credenciales incorrectas.", variant: "destructive" });
        setCurrentUser(null);
        setIsAuthenticated(false);
        setIsCurrentUserAdmin(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({ title: "Error de Inicio de Sesión", description: "Ocurrió un problema al iniciar sesión.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [router, toast, fetchUserDetails]);

  const register = useCallback(async (firstName?: string, lastName?: string, password?: string) => {
    setIsLoading(true);
    if (!db) {
      toast({ title: 'Error de Configuración', description: 'La base de datos no está disponible.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    if (!firstName || !lastName || !password) {
      toast({ title: "Error de Registro", description: "Todos los campos son requeridos.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const generatedUsername = `${firstName.trim().toLowerCase()}.${lastName.trim().toLowerCase()}`;

    try {
      const existingUser = await fetchUserDetails(generatedUsername);
      if (existingUser) {
        toast({ title: "Error de Registro", description: "Este usuario (nombre.apellido) ya existe.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const newUserDocRef = doc(collection(db, 'users'), generatedUsername);
      const newUser: Omit<UserData, 'firestoreId'> = {
        username: generatedUsername,
        password: password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isAdmin: false,
        createdAt: serverTimestamp() as Timestamp,
      };

      await setDoc(newUserDocRef, newUser);

      const capitalizedFirstName = newUser.firstName.charAt(0).toUpperCase() + newUser.firstName.slice(1).toLowerCase();
      toast({ title: "Registro Exitoso", description: `Cuenta creada para ${capitalizedFirstName}. Usuario: ${newUser.username}` });
      router.push('/login');

    } catch (error) {
      console.error('Registration error:', error);
      toast({ title: "Error de Registro", description: "Ocurrió un problema al crear la cuenta.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchUserDetails, router]);


  const logout = useCallback(() => {
    localStorage.removeItem(RXLOCAL_CURRENT_USER_USERNAME_KEY);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsCurrentUserAdmin(false);
    router.push('/login');
    toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
  }, [router, toast]);

  const getCurrentUserUsername = useCallback((): string | null => {
    try {
      return localStorage.getItem(RXLOCAL_CURRENT_USER_USERNAME_KEY);
    } catch (error) {
      return null;
    }
  }, []);

  const getCurrentUserDetails = useCallback(async (): Promise<UserData | null> => {
    const username = getCurrentUserUsername();
    if (username) {
        return fetchUserDetails(username);
    }
    return null;
  }, [getCurrentUserUsername, fetchUserDetails]);


  const getUsersFromFirestore = useCallback(async (): Promise<UserData[]> => {
    if (!db) {
      console.error("Firestore instance (db) is not available in getUsersFromFirestore.");
      throw new Error("La base de datos (Firestore) no está inicializada o disponible.");
    }
    try {
      const usersCollectionRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollectionRef);
      const usersList = usersSnapshot.docs.map(docSnapshot => ({
        firestoreId: docSnapshot.id,
        username: docSnapshot.data().username,
        firstName: docSnapshot.data().firstName,
        lastName: docSnapshot.data().lastName,
        isAdmin: docSnapshot.data().isAdmin || false,
        // Do not include password in the list returned to the client
      } as UserData));
      return usersList;
    } catch (error: any) {
      console.error("Error fetching users from Firestore in hook:", error);
      throw new Error(`Error al obtener usuarios de Firestore: ${error.message || String(error)}`);
    }
  }, []);

  const deleteUserFromFirestore = async (userFirestoreId: string): Promise<void> => {
    if (!db) {
      toast({ title: 'Error de Configuración', description: 'La base de datos no está disponible.', variant: 'destructive' });
      throw new Error("Firestore not initialized");
    }
    if (!userFirestoreId) {
      toast({ title: 'Error', description: 'ID de usuario no proporcionado.', variant: 'destructive' });
      throw new Error("User ID not provided for deletion.");
    }
    try {
      const userDocRef = doc(db, 'users', userFirestoreId);
      await deleteDoc(userDocRef);
      toast({ title: 'Usuario Eliminado', description: 'El usuario ha sido eliminado de Firestore.' });
    } catch (error) {
      console.error('Error deleting user from Firestore:', error);
      toast({ title: 'Error al Eliminar', description: 'No se pudo eliminar el usuario de Firestore.', variant: 'destructive' });
      throw error;
    }
  };


  return {
    isAuthenticated,
    isLoading,
    currentUser,
    isCurrentUserAdmin,
    login,
    register,
    logout,
    getCurrentUserUsername,
    getCurrentUserDetails,
    fetchUserDetails,
    getUsersFromFirestore,
    deleteUserFromFirestore,
  };
}
