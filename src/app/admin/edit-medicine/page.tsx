
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthWrapper from '@/components/AuthWrapper';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, FilePenLine, Save, Search, ShieldAlert, Loader2, XCircle } from 'lucide-react';
import { type Medicine, getMedicineByIdFromFirestore, updateMedicineDetailsInFirestore } from '@/lib/medicineService';

export default function EditMedicinePage() {
  const { isCurrentUserAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [searchId, setSearchId] = useState('');
  const [foundMedicine, setFoundMedicine] = useState<Medicine | null>(null);
  const [editableName, setEditableName] = useState('');
  const [editablePresentation, setEditablePresentation] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isCurrentUserAdmin) {
      toast({
        title: 'Acceso Denegado',
        description: 'No tienes permisos para acceder a esta página.',
        variant: 'destructive',
      });
      router.replace('/dashboard');
    }
  }, [isCurrentUserAdmin, authLoading, router, toast]);

  const handleSearchMedicine = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    if (!searchId.trim()) {
      toast({ title: 'Código Requerido', description: 'Por favor, ingresa un Código para buscar.', variant: 'destructive' });
      return;
    }
    setIsLoadingData(true);
    setFoundMedicine(null); // Reset previous found medicine
    try {
      const medicine = await getMedicineByIdFromFirestore(searchId.trim().toUpperCase());
      if (medicine) {
        setFoundMedicine(medicine);
        setEditableName(medicine.name);
        setEditablePresentation(medicine.presentation);
        toast({ title: 'Medicamento Encontrado', description: `Editando: ${medicine.name}`, variant: 'success' });
      } else {
        toast({ title: 'No Encontrado', description: `No se encontró medicamento con Código: ${searchId.trim().toUpperCase()}`, variant: 'destructive' });
      }
    } catch (error) {
      console.error("Error searching medicine:", error);
      toast({ title: 'Error en Búsqueda', description: 'No se pudo buscar el medicamento.', variant: 'destructive' });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveChanges = async (event: FormEvent) => {
    event.preventDefault();
    if (!foundMedicine || !editableName.trim() || !editablePresentation.trim()) {
      toast({ title: 'Campos Incompletos', description: 'Nombre y presentación son requeridos.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      await updateMedicineDetailsInFirestore(foundMedicine.id, editableName.trim(), editablePresentation.trim());
      toast({ title: 'Cambios Guardados', description: `Medicamento ${editableName.trim()} actualizado.`, variant: 'success' });
      resetFormAndSearch();
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({ title: 'Error al Guardar', description: 'No se pudieron guardar los cambios.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const resetFormAndSearch = () => {
    setSearchId('');
    setFoundMedicine(null);
    setEditableName('');
    setEditablePresentation('');
    setIsLoadingData(false);
    setIsSaving(false);
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
      <div className="mb-6">
        <Button
          variant="default"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => router.push('/admin')}
          aria-label="Volver al Panel de Admin"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader className="text-center">
            <FilePenLine className="h-12 w-12 mx-auto text-primary mb-3" />
            <CardTitle className="text-2xl md:text-3xl font-semibold text-foreground">
              Editar Medicamento
            </CardTitle>
            <CardDescription>
              Busca un medicamento por su Código para editar su nombre y presentación.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {!foundMedicine ? (
              <form onSubmit={handleSearchMedicine} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="searchId">Código del Medicamento a Editar</Label>
                  <Input
                    id="searchId"
                    type="text"
                    placeholder="Ej: A0202 (será convertido a mayúsculas)"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-600/90 text-white" disabled={isLoadingData}>
                  {isLoadingData ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                  Buscar Medicamento
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSaveChanges} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="medicineIdDisplay">Código del Medicamento (No editable)</Label>
                  <Input
                    id="medicineIdDisplay"
                    type="text"
                    value={foundMedicine.id}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicineName">Nombre del Medicamento</Label>
                  <Input
                    id="medicineName"
                    type="text"
                    placeholder="Ej: Omeprazol 40mg/ml"
                    value={editableName}
                    onChange={(e) => setEditableName(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="presentation">Presentación</Label>
                  <Input
                    id="presentation"
                    type="text"
                    placeholder="Ej: Inyectable, Comprimidos, Jarabe"
                    value={editablePresentation}
                    onChange={(e) => setEditablePresentation(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
                 <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                        Nota: El stock actual ({foundMedicine.currentStock}) y el historial de dispensación no se pueden editar desde esta pantalla.
                    </p>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                  Guardar Cambios
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={resetFormAndSearch} disabled={isSaving}>
                   <XCircle className="mr-2 h-5 w-5" />
                  Cancelar / Buscar Otro
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
