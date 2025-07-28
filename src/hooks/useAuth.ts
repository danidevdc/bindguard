
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

export interface UserData {
  uid: string; // Firebase Auth UID
  email: string | null;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
  createdAt?: Timestamp;
  activityLog?: ActivityLogEntry[];
}

export interface ActivityLogEntry {
  timestamp: Timestamp;
  action: string;
  details?: string;
}

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  const fetchUserData = useCallback(async (uid: string): Promise<UserData | null> => {
    if (!db) return null;
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data from Firestore:', error);
      toast({ title: 'Error de Red', description: 'No se pudieron obtener los datos del usuario.', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        const userData = await fetchUserData(user.uid);
        if (userData) {
          setCurrentUserData(userData);
          setIsCurrentUserAdmin(!!userData.isAdmin);
        } else {
          // This case might happen if user exists in Auth but not in Firestore.
          // Decide how to handle this, e.g., create a Firestore record or log them out.
          console.warn(`User with UID ${user.uid} exists in Firebase Auth but not in Firestore.`);
          setCurrentUserData(null);
          setIsCurrentUserAdmin(false);
        }
        setIsAuthenticated(true);
      } else {
        setFirebaseUser(null);
        setCurrentUserData(null);
        setIsAuthenticated(false);
        setIsCurrentUserAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  const login = async (email?: string, password?: string) => {
    if (!email || !password) {
      toast({ title: "Error", description: "Correo y contraseña son requeridos.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(userCredential.user.uid);
      const capitalizedFirstName = userData?.firstName.charAt(0).toUpperCase() + userData!.firstName.slice(1).toLowerCase();
      toast({ title: "Inicio de Sesión Exitoso", description: `¡Bienvenido de nuevo, ${capitalizedFirstName}!` });
      router.push('/dashboard');
    } catch (error: any) {
      const errorCode = error.code;
      let description = "Ocurrió un problema al iniciar sesión.";
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        description = "Credenciales incorrectas. Verifica tu correo y contraseña.";
      }
      toast({ title: "Error de Inicio de Sesión", description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (firstName?: string, lastName?: string, email?: string, password?: string) => {
    if (!firstName || !lastName || !email || !password) {
      toast({ title: "Error de Registro", description: "Todos los campos son requeridos.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      // Step 1: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Create user document in Firestore
      const newUserDocRef = doc(db, 'users', user.uid);
      
      const isAdmin = email.toLowerCase() === 'daniish77@gmail.com';

      const newUser: Omit<UserData, 'createdAt'> = {
        uid: user.uid,
        email: user.email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isAdmin: isAdmin,
        activityLog: [],
      };
      await setDoc(newUserDocRef, {
        ...newUser,
        createdAt: serverTimestamp() as Timestamp,
      });

      const capitalizedFirstName = newUser.firstName.charAt(0).toUpperCase() + newUser.firstName.slice(1).toLowerCase();
      if(isAdmin){
         toast({ title: "Registro de Admin Exitoso", description: `Cuenta de Administrador creada para ${capitalizedFirstName}.` });
      } else {
         toast({ title: "Registro Exitoso", description: `Cuenta creada para ${capitalizedFirstName}.` });
      }
      router.push('/login');

    } catch (error: any) {
       let description = "Ocurrió un problema al crear la cuenta.";
       if (error.code === 'auth/email-already-in-use') {
           description = "Este correo electrónico ya está registrado.";
       } else if (error.code === 'auth/weak-password') {
           description = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
       }
       toast({ title: "Error de Registro", description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
    } catch (error) {
       console.error("Logout error", error);
       toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };
  
  const sendPasswordResetEmail = async (email: string) => {
    if (!email) {
      toast({ title: "Correo Requerido", description: "Por favor, ingresa tu correo electrónico.", variant: "destructive" });
      return;
    }
    try {
      await firebaseSendPasswordResetEmail(auth, email);
      toast({
        title: "Correo de Recuperación Enviado",
        description: `Se ha enviado un enlace para restablecer tu contraseña a ${email}.`,
        duration: 5000,
      });
    } catch (error: any) {
       let description = "Ocurrió un error al enviar el correo.";
       if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
           description = "No se encontró ninguna cuenta con este correo electrónico.";
       }
       toast({ title: "Error", description, variant: "destructive" });
    }
  };

  const getUsersFromFirestore = useCallback(async (): Promise<UserData[]> => {
    if (!db) throw new Error("La base de datos (Firestore) no está inicializada.");
    try {
      const usersCollectionRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollectionRef);
      return usersSnapshot.docs.map(docSnapshot => docSnapshot.data() as UserData);
    } catch (error: any) {
      console.error("Error fetching users from Firestore in hook:", error);
      throw new Error(`Error al obtener usuarios de Firestore: ${error.message || String(error)}`);
    }
  }, []);

  const deleteUserFromFirestore = async (uid: string): Promise<void> => {
    if (!db || !uid) throw new Error("Firestore not initialized or UID missing.");
    // Note: This only deletes the Firestore record. Deleting the Firebase Auth user
    // requires a privileged environment (like a Cloud Function) and is not implemented here.
    // The user will still be able to log in but won't have associated data.
    console.warn(`Attempting to delete user record for UID: ${uid} from Firestore. This does not delete the Firebase Auth user.`);
    try {
      await deleteDoc(doc(db, 'users', uid));
      toast({ title: 'Usuario Eliminado', description: 'El registro del usuario ha sido eliminado de Firestore.' });
    } catch (error) {
      console.error('Error deleting user from Firestore:', error);
      toast({ title: 'Error al Eliminar', description: 'No se pudo eliminar el registro del usuario.', variant: 'destructive' });
      throw error;
    }
  };
  
  const getCurrentUserUsername = (): string | null => {
    if (currentUserData) {
      // Return username in "firstName.lastName" format, lowercase.
      return `${currentUserData.firstName.toLowerCase()}.${currentUserData.lastName.toLowerCase()}`;
    }
    // Fallback to email if user data is not yet loaded, though less ideal.
    return firebaseUser?.email || null;
  };
  
  const getCurrentUserDetails = async (): Promise<UserData | null> => {
    if (firebaseUser) {
        return fetchUserData(firebaseUser.uid);
    }
    return null;
  };

  return {
    isAuthenticated,
    isLoading,
    firebaseUser, // Expose the raw Firebase User object
    currentUserData, // Expose the Firestore data for the current user
    isCurrentUserAdmin,
    login,
    register,
    logout,
    sendPasswordResetEmail,
    getUsersFromFirestore,
    deleteUserFromFirestore,
    getCurrentUserUsername, // Maintain for compatibility if needed elsewhere
    getCurrentUserDetails,
  };
}
