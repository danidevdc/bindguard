
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AuthWrapper from '@/components/AuthWrapper';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, ShieldAlert, Loader2, Power, RotateCw, CheckCircle, XCircle } from 'lucide-react';
import { type Medicine, getMedicinesFromFirestore, updateMedicineBlockedStatus } from '@/lib/medicineService';
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

export default function ToggleMedicineStatusPage() {
  const { isCurrentUserAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingMedicineId, setTogglingMedicineId] = useState<string | null>(null);

  const [medicineToConfirm, setMedicineToConfirm] = useState<{ id: string, name: string, currentStatus: boolean } | null>(null);


  const loadMedicines = useCallback(async (showToast = false) => {
    setIsLoadingMedicines(true);
    try {
      const firestoreMedicines = await getMedicinesFromFirestore();
      setMedicines(firestoreMedicines);
      if (showToast) {
        toast({
          title: "Lista Actualizada",
          description: "La lista de medicamentos ha sido recargada.",
        });
      }
    } catch (error) {
      console.error("Failed to load medicines:", error);
      toast({ title: 'Error al Cargar Medicamentos', description: 'No se pudo obtener la lista de medicamentos.', variant: 'destructive' });
    } finally {
      setIsLoadingMedicines(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !isCurrentUserAdmin) {
      toast({ title: 'Acceso Denegado', description: 'No tienes permisos para esta página.', variant: 'destructive' });
      router.replace('/dashboard');
    } else if (isCurrentUserAdmin) {
      loadMedicines();
    }
  }, [isCurrentUserAdmin, authLoading, router, toast, loadMedicines]);

  const filteredMedicines = useMemo(() => {
    if (!searchTerm) return medicines;
    return medicines.filter(med =>
      med.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medicines, searchTerm]);

  const handleToggleStatus = async () => {
    if (!medicineToConfirm) return;

    setTogglingMedicineId(medicineToConfirm.id);
    try {
      await updateMedicineBlockedStatus(medicineToConfirm.id, !medicineToConfirm.currentStatus);
      toast({
        title: 'Estado Actualizado',
        description: `El medicamento ${medicineToConfirm.name} ha sido ${!medicineToConfirm.currentStatus ? 'cerrado' : 'abierto'}.`,
      });
      loadMedicines(); // Recargar la lista
    } catch (error) {
      console.error("Error toggling medicine status:", error);
      toast({ title: 'Error al Actualizar', description: 'No se pudo cambiar el estado del medicamento.', variant: 'destructive' });
    } finally {
      setTogglingMedicineId(null);
      setMedicineToConfirm(null);
    }
  };

  if (authLoading || !isCurrentUserAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <ShieldAlert className="h-16 w-16 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <AuthWrapper>
    <AlertDialog open={!!medicineToConfirm} onOpenChange={(isOpen) => { if (!isOpen) setMedicineToConfirm(null); }}>
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
          onClick={() => loadMedicines(true)}
          disabled={isLoadingMedicines || !!togglingMedicineId}
          className="hover:bg-accent hover:text-accent-foreground"
        >
          {isLoadingMedicines ? <Loader2 className="h-5 w-5 animate-spin" /> : <RotateCw className="h-5 w-5" />}
           <span className="ml-2 hidden sm:inline">Refrescar</span>
        </Button>
      </div>

      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <Power className="h-12 w-12 mx-auto text-primary mb-3" />
          <CardTitle className="text-2xl md:text-3xl font-semibold text-foreground">
            Abrir/Cerrar Medicamentos
          </CardTitle>
          <CardDescription>
            Gestiona la disponibilidad de los medicamentos para dispensación y entrada de stock.
            Un medicamento cerrado no podrá ser usado en nuevas transacciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por ID o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 shadow-sm"
              />
            </div>
          </div>

          {isLoadingMedicines && !filteredMedicines.length ? (
            <div className="flex justify-center items-center p-10">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="ml-3 text-muted-foreground">Cargando medicamentos...</p>
            </div>
          ) : filteredMedicines.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-center">Estado Actual</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMedicines.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell className="font-medium">{med.id}</TableCell>
                      <TableCell>{med.name}</TableCell>
                      <TableCell className="text-center">
                        {med.isBlocked ? (
                          <Badge variant="destructive" className="flex items-center w-fit mx-auto">
                            <XCircle className="mr-1 h-3.5 w-3.5" /> Cerrado
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-600/90 flex items-center w-fit mx-auto">
                            <CheckCircle className="mr-1 h-3.5 w-3.5" /> Abierto
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialogTrigger asChild>
                          <Button
                            variant={med.isBlocked ? "default" : "destructive"}
                            size="sm"
                            className={med.isBlocked ? "bg-green-600 hover:bg-green-600/90" : ""}
                            onClick={() => setMedicineToConfirm({ id: med.id, name: med.name, currentStatus: med.isBlocked })}
                            disabled={togglingMedicineId === med.id}
                            title={med.isBlocked ? `Abrir ${med.name}` : `Cerrar ${med.name}`}
                          >
                            {togglingMedicineId === med.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : med.isBlocked ? (
                              <><CheckCircle className="mr-1 h-4 w-4" /> Abrir</>
                            ) : (
                              <><XCircle className="mr-1 h-4 w-4" /> Cerrar</>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">
              {searchTerm ? "No se encontraron medicamentos con ese criterio." : "No hay medicamentos registrados."}
            </p>
          )}
        </CardContent>
      </Card>
      {medicineToConfirm && (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Cambio de Estado</AlertDialogTitle>
                <AlertDialogDescription>
                    ¿Estás seguro de que quieres {medicineToConfirm.currentStatus ? 'ABRIR' : 'CERRAR'} el medicamento 
                    <span className="font-semibold"> {medicineToConfirm.name} (ID: {medicineToConfirm.id})</span>?
                    <br/>
                    {medicineToConfirm.currentStatus 
                        ? "Al abrirlo, estará disponible para nuevas transacciones."
                        : "Al cerrarlo, no se podrá usar en nuevas dispensaciones o entradas de stock."
                    }
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setMedicineToConfirm(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleToggleStatus}
                  className={medicineToConfirm.currentStatus ? "bg-green-600 hover:bg-green-600/90 text-white" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"}
                >
                  {medicineToConfirm.currentStatus ? 'Sí, Abrir Medicamento' : 'Sí, Cerrar Medicamento'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      )}
      </AlertDialog>
    </AuthWrapper>
  );
}
