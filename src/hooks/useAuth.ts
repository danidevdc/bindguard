
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
import { initializeDefaultMedicines } from '@/lib/medicineService';


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
      return null;
    }
    try {
      const usersRef = collection(db, 'users');
      // Since document ID is now the username, we can try to get it directly
      const userDocRef = doc(usersRef, username.toLowerCase());
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return { firestoreId: userDoc.id, ...userDoc.data() } as UserData;
      }
      // Fallback to query if needed, though direct doc access should be primary
      // const q = query(usersRef, where('username', '==', username));
      // const querySnapshot = await getDocs(q);
      // if (!querySnapshot.empty) {
      //   const userDocFromQuery = querySnapshot.docs[0];
      //   return { firestoreId: userDocFromQuery.id, ...userDocFromQuery.data() } as UserData;
      // }
      return null;
    } catch (error) {
      console.error('Error fetching user details from Firestore:', error);
      toast({ title: 'Error de Red', description: 'No se pudieron obtener los detalles del usuario.', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const checkUsernameExists = useCallback(async (username: string): Promise<boolean> => {
    if (!db) return false;
    const userDocRef = doc(db, 'users', username.toLowerCase());
    const docSnap = await getDoc(userDocRef);
    return docSnap.exists();
  }, []);

  const initializeDefaultAdminAndData = useCallback(async () => {
    if (!db) {
      console.error("useAuth: Firestore db not ready yet during admin/data initialization.");
      toast({
        title: 'Error Crítico de Configuración',
        description: 'La conexión con la base de datos no se pudo establecer. Verifica la configuración de Firebase y tu conexión.',
        variant: 'destructive',
        duration: 10000
      });
      setIsLoading(false);
      return;
    }
    try {
      const adminUsername = 'admin.admin';
      const adminDocRef = doc(db, 'users', adminUsername);
      const adminSnapshot = await getDoc(adminDocRef);

      if (!adminSnapshot.exists()) {
        const adminUser: Omit<UserData, 'firestoreId'> = {
          username: adminUsername,
          password: 'admin123', 
          firstName: 'Admin',
          lastName: 'BindGuard',
          isAdmin: true,
          createdAt: serverTimestamp() as Timestamp,
        };
        await setDoc(adminDocRef, adminUser);
        console.log(`Default admin user "${adminUsername}" created in Firestore.`);
      }
      await initializeDefaultMedicines();
    } catch (error) {
      console.error('Error initializing default admin or medicines:', error);
      toast({ title: 'Error de Inicialización', description: 'No se pudo configurar el administrador o datos iniciales.', variant: 'destructive' });
    }
  }, [toast]);


  const checkUserSessionAndAdmin = useCallback(async () => {
    setIsLoading(true);
    if (!db) {
        console.warn("useAuth: Firestore db not ready yet during session check. App may not function correctly.");
        toast({
          title: 'Error de Conexión con BD',
          description: 'La base de datos no está disponible. Revisa tu configuración de Firebase y conexión a internet.',
          variant: 'destructive',
          duration: 7000
        });
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
  }, [fetchUserDetails, initializeDefaultAdminAndData, toast]);


  useEffect(() => {
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
      const userDetails = await fetchUserDetails(usernameInput.toLowerCase());

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

  const register = useCallback(async (firstName?: string, lastName?: string, username?: string, password?: string) => {
    setIsLoading(true);
    if (!db) {
      toast({ title: 'Error de Configuración', description: 'La base de datos no está disponible.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    if (!firstName || !lastName || !username || !password) {
      toast({ title: "Error de Registro", description: "Todos los campos son requeridos.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const targetUsername = username.trim().toLowerCase();

    try {
      const existingUser = await fetchUserDetails(targetUsername);
      if (existingUser) {
        toast({ title: "Error de Registro", description: "Este nombre de usuario ya existe. Por favor, elige otro.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      
      const newUserDocRef = doc(collection(db, 'users'), targetUsername);
      const newUser: Omit<UserData, 'firestoreId'> = {
        username: targetUsername,
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

  // Placeholder for password reset logic - requires backend
  const sendPasswordResetEmail = async (email: string): Promise<void> => {
    // In a real app, this would:
    // 1. Verify the email exists in your user database (e.g., check Firestore for a user with this email if you store it)
    // 2. Generate a secure, unique, time-limited reset token.
    // 3. Store the token hashed in the database, associated with the user.
    // 4. Send an email to the user with a link containing this token (e.g., /reset-password?token=...).
    // This requires a backend (e.g., Firebase Functions) and an email sending service.
    console.warn(`Simulating password reset email to: ${email}. This requires backend implementation.`);
    toast({
      title: "Simulación de Recuperación",
      description: `Si ${email} está registrado, se enviaría un enlace de recuperación (funcionalidad no implementada).`,
      duration: 5000,
    });
    // Simulate success for UI purposes
    return Promise.resolve();
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
    checkUsernameExists, // Expose for registration form
    sendPasswordResetEmail, // Expose for forgot password form
  };
}
