
"use client";

import { useState, type FormEvent, useEffect, type ChangeEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AuthWrapper from '@/components/AuthWrapper';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, PillBottle, Save, ShieldAlert, UploadCloud } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getStoredMedicines, saveStoredMedicines, type Medicine, type DispensingRecord } from '@/lib/placeholder-data';
import { parseISO, isValid } from 'date-fns';


interface MedicineJsonFormat {
  id?: string;
  name?: string;
  presentation?: string;
  initialStock?: number | string;
  expirationDate?: string; // Expects YYYY-MM-DD
}

export default function AddMedicinePage() {
  const { isCurrentUserAdmin, isLoading: authLoading, getCurrentUserUsername } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [medicineId, setMedicineId] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [presentation, setPresentation] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [jsonExpirationDate, setJsonExpirationDate] = useState<string | undefined>(undefined); // For storing expiration from JSON
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleJsonFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== 'application/json') {
      toast({
        title: 'Archivo Inválido',
        description: 'Por favor, selecciona un archivo JSON.',
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Error al leer el archivo.');
        }
        const jsonData = JSON.parse(text) as MedicineJsonFormat;

        let stockValue = '';
        if (jsonData.initialStock !== undefined) {
            if (typeof jsonData.initialStock === 'number') {
                stockValue = jsonData.initialStock.toString();
            } else if (typeof jsonData.initialStock === 'string') {
                stockValue = jsonData.initialStock;
            }
        }

        setMedicineId(jsonData.id || '');
        setMedicineName(jsonData.name || '');
        setPresentation(jsonData.presentation || '');
        setInitialStock(stockValue);
        
        if (jsonData.expirationDate) {
          const parsedDate = parseISO(jsonData.expirationDate);
          if (isValid(parsedDate)) {
            setJsonExpirationDate(jsonData.expirationDate);
          } else {
            toast({
              title: 'Fecha de Expiración Inválida en JSON',
              description: 'El formato de expirationDate debe ser YYYY-MM-DD. Se ignorará este campo.',
              variant: 'destructive',
            });
            setJsonExpirationDate(undefined);
          }
        } else {
          setJsonExpirationDate(undefined);
        }


        toast({
          title: 'JSON Cargado',
          description: 'Formulario rellenado con los datos del archivo JSON.',
        });
      } catch (error) {
        console.error('Error parsing JSON:', error);
        toast({
          title: 'Error al Procesar JSON',
          description: 'El archivo JSON no es válido o no tiene el formato esperado.',
          variant: 'destructive',
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      toast({
        title: 'Error de Lectura',
        description: 'No se pudo leer el archivo seleccionado.',
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const stockNum = initialStock.trim() === '' ? 0 : parseInt(initialStock);
    const currentId = medicineId.trim().toUpperCase();
    const currentName = medicineName.trim();
    const currentPresentation = presentation.trim();

    if (!currentId || !currentName || !currentPresentation) {
      toast({
        title: 'Campos Incompletos',
        description: 'ID, Nombre y Presentación son requeridos.',
        variant: 'destructive',
      });
      return;
    }

    if (initialStock.trim() !== '' && (isNaN(stockNum) || stockNum < 0)) {
       toast({
        title: 'Stock Inválido',
        description: 'El stock inicial debe ser un número positivo o cero.',
        variant: 'destructive',
      });
      return;
    }

    const medicines = getStoredMedicines();
    if (medicines.find(med => med.id.toUpperCase() === currentId)) {
      toast({
        title: 'ID Duplicado',
        description: `Ya existe un medicamento con el ID: ${currentId}.`,
        variant: 'destructive',
      });
      return;
    }

    const newDispensingHistory: DispensingRecord[] = [];
    if (stockNum > 0) {
      newDispensingHistory.push({
        id: `stock_init_${currentId}_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        rxNumber: 'STOCK-INICIAL',
        quantity: stockNum,
        type: 'stocked',
        userName: getCurrentUserUsername() || 'admin.admin',
        expirationDate: jsonExpirationDate, // Use expiration date from JSON if available
      });
    }

    const newMedicine: Medicine = {
      id: currentId,
      name: currentName,
      presentation: currentPresentation,
      description: '', // Default empty description
      currentStock: stockNum,
      lastUpdated: new Date().toISOString(),
      dispensingHistory: newDispensingHistory,
    };

    saveStoredMedicines([...medicines, newMedicine]);

    toast({
      title: 'Medicamento Registrado',
      description: `${newMedicine.name} (ID: ${newMedicine.id}) ha sido añadido con stock inicial ${newMedicine.currentStock}.`,
    });

    // Reset form
    setMedicineId('');
    setMedicineName('');
    setPresentation('');
    setInitialStock('');
    setJsonExpirationDate(undefined);
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
            <PillBottle className="h-12 w-12 mx-auto text-primary mb-3" />
            <CardTitle className="text-2xl md:text-3xl font-semibold text-foreground">
              Añadir Nuevo Medicamento
            </CardTitle>
            <CardDescription>
              Ingresa los detalles del nuevo medicamento o carga un archivo JSON.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 mb-6">
              <Label htmlFor="jsonUpload" className="text-base font-medium">Cargar desde JSON</Label>
              <div className="flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-grow"
                >
                  <UploadCloud className="mr-2 h-5 w-5" />
                  Seleccionar Archivo JSON
                </Button>
                <Input
                  id="jsonUpload"
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleJsonFileUpload}
                  className="hidden"
                />
              </div>
               <p className="text-xs text-muted-foreground">
                El JSON debe tener los campos: `id` (string), `name` (string), `presentation` (string), `initialStock` (number/string), y opcionalmente `expirationDate` (string, formato YYYY-MM-DD).
              </p>
            </div>
            <Separator className="my-6" />
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="medicineId">ID del Medicamento</Label>
                <Input
                  id="medicineId"
                  type="text"
                  placeholder="Ej: A0205"
                  value={medicineId}
                  onChange={(e) => setMedicineId(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicineName">Nombre del Medicamento</Label>
                <Input
                  id="medicineName"
                  type="text"
                  placeholder="Ej: Omeprazol 40mg/ml"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
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
                  value={presentation}
                  onChange={(e) => setPresentation(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initialStock">Stock Inicial (Opcional)</Label>
                <Input
                  id="initialStock"
                  type="number"
                  inputMode="numeric"
                  placeholder="Ej: 1000 (o dejar vacío para 0)"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  min="0"
                  className="bg-background"
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="mr-2 h-5 w-5" />
                Guardar Medicamento
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
