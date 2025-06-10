
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase'; // Corrected import
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
  password?: string; // Storing passwords in Firestore directly is not secure for production. Use Firebase Auth or hash passwords.
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
  createdAt?: Timestamp;
  firestoreId?: string; // Document ID from Firestore
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
      // toast({ title: 'Error de Configuración', description: 'La base de datos no está inicializada.', variant: 'destructive' });
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
      toast({
        title: 'Error Crítico de Configuración',
        description: 'La conexión con la base de datos (Firestore) no se pudo establecer. Verifica la configuración de Firebase en .env.local y las reglas de seguridad.',
        variant: 'destructive',
        duration: 10000 // Show longer
      });
      setIsLoading(false);
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
          password: 'admin123', // Storing passwords in Firestore directly is not secure for production.
          firstName: 'Admin',
          lastName: 'BindGuard',
          isAdmin: true,
          createdAt: serverTimestamp() as Timestamp,
        };
        // Use the username as the document ID for simplicity in this custom auth system
        await setDoc(doc(usersRef, 'admin.admin'), adminUser);
        console.log('Default admin user "admin.admin" created in Firestore.');
      }

      // Initialize Default Medicines (from medicineService)
      await initializeDefaultMedicines(); // This function now checks if db is available

    } catch (error) {
      console.error('Error initializing default admin or mock medicines:', error);
      toast({ title: 'Error de Inicialización del Sistema', description: 'No se pudo configurar el administrador o datos iniciales.', variant: 'destructive' });
    }
  }, [toast]);


  const checkUserSessionAndAdmin = useCallback(async () => {
    setIsLoading(true);
    if (!db) {
        console.warn("Firestore not available during session check. App may not function correctly.");
        toast({
          title: 'Error de Conexión',
          description: 'La base de datos no está disponible. Revisa tu configuración de Firebase y conexión a internet.',
          variant: 'destructive',
          duration: 7000
        });
        setIsLoading(false);
        return;
    }
    await initializeDefaultAdminAndData(); // Ensures admin and default data are checked/created

    try {
      const storedUsername = localStorage.getItem(RXLOCAL_CURRENT_USER_USERNAME_KEY);
      if (storedUsername) {
        const userDetails = await fetchUserDetails(storedUsername);
        if (userDetails) {
          setCurrentUser(userDetails);
          setIsAuthenticated(true);
          setIsCurrentUserAdmin(!!userDetails.isAdmin);
        } else {
          // User in localStorage but not in DB (e.g., deleted from Firestore)
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
      // Fallback to unauthenticated state
      setCurrentUser(null);
      setIsAuthenticated(false);
      setIsCurrentUserAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserDetails, initializeDefaultAdminAndData, toast]);


  useEffect(() => {
    // The check for db is now inside checkUserSessionAndAdmin
    checkUserSessionAndAdmin();
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

      if (userDetails && userDetails.password === passwordInput) { // Password check (insecure for production)
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

      // Use generatedUsername as the document ID for custom auth
      const newUserDocRef = doc(collection(db, 'users'), generatedUsername);
      const newUser: Omit<UserData, 'firestoreId'> = {
        username: generatedUsername,
        password: password, // Storing passwords in Firestore directly is not secure for production.
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isAdmin: false, // New users are not admins by default
        createdAt: serverTimestamp() as Timestamp,
      };

      await setDoc(newUserDocRef, newUser);

      const capitalizedFirstName = newUser.firstName.charAt(0).toUpperCase() + newUser.firstName.slice(1).toLowerCase();
      toast({ title: "Registro Exitoso", description: `Cuenta creada para ${capitalizedFirstName}. Usuario: ${newUser.username}` });
      router.push('/login'); // Redirect to login after successful registration

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
    // Ensure this only runs on the client-side if localStorage is used.
    // For Next.js 13+ App Router, direct localStorage access at component top-level can be tricky.
    // This hook setup with useEffect for session check is generally fine.
    try {
      return localStorage.getItem(RXLOCAL_CURRENT_USER_USERNAME_KEY);
    } catch (error) {
      // Handle cases where localStorage might not be available (e.g., SSR context, though unlikely here with "use client")
      return null;
    }
  }, []);

  // Provides full user details from Firestore based on the currently logged-in username.
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
        firestoreId: docSnapshot.id, // Store the Firestore document ID
        username: docSnapshot.data().username,
        firstName: docSnapshot.data().firstName,
        lastName: docSnapshot.data().lastName,
        isAdmin: docSnapshot.data().isAdmin || false,
        // Do not include password in the list returned to the client
      } as UserData));
      return usersList;
    } catch (error: any) {
      console.error("Error fetching users from Firestore in hook:", error);
      // Propagate a more user-friendly or structured error
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
      throw error; // Re-throw to allow caller to handle if needed
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
    getCurrentUserUsername, // Expose this if direct username access is needed elsewhere
    getCurrentUserDetails, // Expose for getting full details on demand
    fetchUserDetails, // Expose if needed for other specific lookups
    getUsersFromFirestore,
    deleteUserFromFirestore,
  };
}
