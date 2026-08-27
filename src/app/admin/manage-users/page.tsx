
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AuthWrapper from '@/components/AuthWrapper';
import { useAuth, type UserData, type ActivityLogEntry } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ShieldAlert, ArrowLeft, Users, Trash2, UserCog, User, Loader2, RefreshCcw, History, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Timestamp } from 'firebase/firestore';

export default function ManageUsersPage() {
  const {
    isCurrentUserAdmin,
    isLoading: authLoading,
    getUsersFromFirestore,
    deleteUserFromFirestore,
    firebaseUser,
  } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [userToViewLog, setUserToViewLog] = useState<UserData | null>(null);
  
  const loggedInUserUid = firebaseUser?.uid;

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
                variant: 'success'
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
    if (!userToDelete || !userToDelete.uid) return;

    if (userToDelete.uid === loggedInUserUid) {
      toast({
        title: 'Acción no permitida',
        description: 'No puedes eliminar tu propia cuenta.',
        variant: 'destructive',
      });
      setUserToDelete(null);
      return;
    }

    const adminUsers = users.filter(u => u.isAdmin);
    if (userToDelete.isAdmin && adminUsers.length <= 1) {
        toast({
            title: 'Acción no permitida',
            description: 'No puedes eliminar al único administrador del sistema.',
            variant: 'destructive',
        });
        setUserToDelete(null);
        return;
    }

    try {
      // This only deletes the Firestore record, not the Auth user.
      await deleteUserFromFirestore(userToDelete.uid);
      loadUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: 'Error al Eliminar',
        description: error instanceof Error ? error.message : 'No se pudo eliminar el usuario.',
        variant: 'destructive',
      });
    } finally {
      setUserToDelete(null);
    }
  };

  if (authLoading && !isCurrentUserAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <ShieldAlert className="h-16 w-16 text-primary animate-pulse" />
      </div>
    );
  }


  return (
    <AuthWrapper>
      <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => { if (!isOpen) setUserToDelete(null); }}>
        <Dialog open={!!userToViewLog} onOpenChange={(isOpen) => { if (!isOpen) setUserToViewLog(null); }}>
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

          <Card className="w-full max-w-4xl mx-auto shadow-lg">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto text-primary mb-3" />
              <CardTitle className="text-2xl md:text-3xl font-semibold text-foreground">
                Gestionar Usuarios
              </CardTitle>
              <CardDescription>
                Ver, eliminar y revisar actividad de usuarios registrados. La eliminación solo borra el registro de la base de datos, no la cuenta de autenticación.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingUsers && !users.length ? (
                <div className="flex justify-center items-center p-10">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="ml-3 text-muted-foreground">Cargando usuarios...</p>
                </div>
              ) : users.length > 0 ? (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nombre Completo</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.filter(user => user && user.uid).map((user) => (
                        <TableRow key={user.uid}>
                          <TableCell className="font-medium">{user.email}</TableCell>
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
                          <TableCell className="text-right space-x-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-blue-600 hover:bg-blue-600/10 hover:text-blue-700"
                                onClick={() => setUserToViewLog(user)}
                                title={`Ver actividad de ${user.email}`}
                            >
                                <History className="h-4 w-4" />
                            </Button>
                            {user.uid !== loggedInUserUid && (
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => setUserToDelete(user)}
                                  disabled={user.isAdmin && users.filter(u => u.isAdmin).length <= 1}
                                  title={
                                    (user.isAdmin && users.filter(u => u.isAdmin).length <= 1) ?
                                    'No se puede eliminar al único administrador' : `Eliminar ${user.email}`
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
                  No hay usuarios registrados o no se pudieron cargar.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Modal para Eliminar Usuario (AlertDialog) */}
          {userToDelete && (
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de que quieres eliminar el registro del usuario &quot;{userToDelete.firstName} {userToDelete.lastName}&quot; ({userToDelete.email})? Esta acción no se puede deshacer y solo elimina los datos de la app, no la cuenta de acceso.
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

          {/* Modal para Ver Log de Actividad (Dialog) */}
          {userToViewLog && (
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-primary" />
                    Log de Actividad para: {userToViewLog.email}
                </DialogTitle>
                <DialogDescription>
                  Historial de acciones relevantes para este usuario.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] mt-4 pr-4">
                {userToViewLog.activityLog && userToViewLog.activityLog.length > 0 ? (
                  <div className="space-y-3">
                    {userToViewLog.activityLog
                      .sort((a, b) => (b.timestamp as Timestamp).toMillis() - (a.timestamp as Timestamp).toMillis()) // Sort by most recent first
                      .map((logEntry, index) => (
                        <div key={index} className="p-3 border rounded-md bg-muted/50 text-sm">
                          <p className="font-semibold text-foreground">{logEntry.action}</p>
                          <p className="text-xs text-muted-foreground">
                            Fecha: {logEntry.timestamp ? format((logEntry.timestamp as Timestamp).toDate(), 'dd/MM/yyyy HH:mm:ss', { locale: es }) : 'Fecha no disponible'}
                          </p>
                          {logEntry.details && (
                            <p className="text-xs text-muted-foreground mt-1">Detalles: {logEntry.details}</p>
                          )}
                        </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay actividad registrada para este usuario.</p>
                )}
              </ScrollArea>
              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => setUserToViewLog(null)}>
                    Cerrar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </AlertDialog>
    </AuthWrapper>
  );
}
