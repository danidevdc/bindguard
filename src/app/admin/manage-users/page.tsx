
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AuthWrapper from '@/components/AuthWrapper';
import { useAuth, type UserData } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ShieldAlert, ArrowLeft, Users, Trash2, UserCog, User, Loader2, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ManageUsersPage() {
  const {
    isCurrentUserAdmin,
    isLoading: authLoading,
    getUsersFromFirestore,
    deleteUserFromFirestore, // Updated function name
    getCurrentUserUsername
  } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const loggedInUsername = getCurrentUserUsername();

  const loadUsers = useCallback(async (showToastOnSuccess = false) => {
    setIsLoadingUsers(true);
    if (isCurrentUserAdmin) {
      try {
        const firestoreUsers = await getUsersFromFirestore();
        setUsers(firestoreUsers);
        if (showToastOnSuccess) {
            toast({
                title: 'Usuarios Actualizados',
                description: 'La lista de usuarios ha sido recargada.',
            });
        }
      } catch (error) {
        console.error("Failed to load users:", error);
        toast({
          title: 'Error al Cargar Usuarios',
          description: error instanceof Error ? error.message : 'No se pudo obtener la lista de usuarios desde la base de datos.',
          variant: 'destructive',
        });
        setUsers([]);
      }
    }
    setIsLoadingUsers(false);
  }, [isCurrentUserAdmin, getUsersFromFirestore, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!isCurrentUserAdmin) {
        toast({
          title: 'Acceso Denegado',
          description: 'No tienes permisos para acceder a esta página.',
          variant: 'destructive',
        });
        router.replace('/dashboard');
      } else {
        loadUsers();
      }
    }
  }, [isCurrentUserAdmin, authLoading, router, toast, loadUsers]);

  const handleDeleteUser = async () => {
    if (!userToDelete || !userToDelete.firestoreId) return;

    if (userToDelete.username === loggedInUsername) {
      toast({
        title: 'Acción no permitida',
        description: 'No puedes eliminar tu propia cuenta.',
        variant: 'destructive',
      });
      setUserToDelete(null);
      return;
    }
    
    const adminUsers = users.filter(u => u.isAdmin);
    if (userToDelete.isAdmin && adminUsers.length === 1 && adminUsers[0].username === userToDelete.username) {
        toast({
            title: 'Acción no permitida',
            description: 'No puedes eliminar al único administrador del sistema.',
            variant: 'destructive',
        });
        setUserToDelete(null);
        return;
    }
    
    // Adicionalmente, proteger la cuenta 'admin.admin' si es el único admin
    if (userToDelete.username === 'admin.admin' && userToDelete.isAdmin && adminUsers.length <= 1) {
       toast({
          title: 'Acción no permitida',
          description: 'No puedes eliminar la cuenta "admin.admin" si es el único administrador.',
          variant: 'destructive',
      });
      setUserToDelete(null);
      return;
    }


    try {
      await deleteUserFromFirestore(userToDelete.firestoreId); // Updated function name
      // El toast de éxito se maneja dentro de deleteUserFromFirestore
      loadUsers(); // Recargar usuarios para actualizar la lista
    } catch (error) {
      console.error("Failed to delete user:", error);
      // El toast de error se maneja dentro de deleteUserFromFirestore o aquí si se relanza
      toast({
        title: 'Error al Eliminar',
        description: error instanceof Error ? error.message : 'No se pudo eliminar el usuario.',
        variant: 'destructive',
      });
    } finally {
      setUserToDelete(null);
    }
  };

  if (authLoading && !isCurrentUserAdmin) { // Mostrar ShieldAlert solo si auth está cargando Y el usuario aún no es admin (o no se sabe)
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <ShieldAlert className="h-16 w-16 text-primary animate-pulse" />
      </div>
    );
  }


  return (
    <AuthWrapper>
      <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => { if (!isOpen) setUserToDelete(null); }}>
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="default"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => router.push('/admin')}
            aria-label="Volver al Panel de Admin"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            onClick={() => loadUsers(true)}
            aria-label="Refrescar lista de usuarios"
            disabled={isLoadingUsers}
            className="hover:bg-accent hover:text-accent-foreground"
          >
            {isLoadingUsers ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCcw className="h-5 w-5" />}
             <span className="ml-2 hidden sm:inline">Refrescar</span>
          </Button>
        </div>

        <Card className="w-full max-w-3xl mx-auto shadow-lg">
          <CardHeader className="text-center">
            <Users className="h-12 w-12 mx-auto text-primary mb-3" />
            <CardTitle className="text-2xl md:text-3xl font-semibold text-foreground">
              Gestionar Usuarios
            </CardTitle>
            <CardDescription>
              Ver y eliminar usuarios registrados en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingUsers && !users.length ? ( // Mostrar loader solo si no hay usuarios en la lista aún
              <div className="flex justify-center items-center p-10">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="ml-3 text-muted-foreground">Cargando usuarios...</p>
              </div>
            ) : users.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.firestoreId || user.username}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <Badge variant="destructive" className="flex items-center w-fit">
                              <UserCog className="mr-1 h-3.5 w-3.5" /> Administrador
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center w-fit">
                              <User className="mr-1 h-3.5 w-3.5" /> Usuario
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.username !== loggedInUsername && ( // No se puede eliminar a sí mismo
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setUserToDelete(user)}
                                disabled={
                                  (user.username === 'admin.admin' && user.isAdmin && users.filter(u => u.isAdmin).length <=1) ||
                                  (user.isAdmin && users.filter(u => u.isAdmin).length === 1 && user.username === users.find(u => u.isAdmin)?.username)
                                }
                                title={
                                  (user.username === 'admin.admin' && user.isAdmin && users.filter(u => u.isAdmin).length <=1) ||
                                  (user.isAdmin && users.filter(u => u.isAdmin).length === 1 && user.username === users.find(u => u.isAdmin)?.username) ?
                                  'No se puede eliminar al único administrador' : `Eliminar ${user.username}`
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">
                No hay usuarios registrados o no se pudieron cargar. Verifica tus reglas de Firestore.
              </p>
            )}
          </CardContent>
        </Card>

        {userToDelete && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que quieres eliminar al usuario "{userToDelete.firstName} {userToDelete.lastName}" ({userToDelete.username})? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Eliminar Usuario
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </AuthWrapper>
  );
}
