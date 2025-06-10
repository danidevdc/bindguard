
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
import { ArrowLeft, PillBottle, Save, ShieldAlert } from 'lucide-react';

interface NewMedicineData {
  id: string;
  name: string;
  presentation: string;
  initialStock: number;
}

export default function AddMedicinePage() {
  const { isCurrentUserAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [medicineId, setMedicineId] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [presentation, setPresentation] = useState('');
  const [initialStock, setInitialStock] = useState('');

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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const stockNum = parseInt(initialStock);

    if (!medicineId.trim() || !medicineName.trim() || !presentation.trim()) {
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

    const newMedicine: NewMedicineData = {
      id: medicineId.trim().toUpperCase(),
      name: medicineName.trim(),
      presentation: presentation.trim(),
      initialStock: initialStock.trim() === '' ? 0 : stockNum,
    };

    console.log('Nuevo Medicamento:', newMedicine);
    toast({
      title: 'Medicamento Registrado (Simulado)',
      description: `${newMedicine.name} (ID: ${newMedicine.id}) con stock inicial ${newMedicine.initialStock}.`,
    });

    // Reset form
    setMedicineId('');
    setMedicineName('');
    setPresentation('');
    setInitialStock('');
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
              Ingresa los detalles del nuevo medicamento para añadirlo al sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
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
