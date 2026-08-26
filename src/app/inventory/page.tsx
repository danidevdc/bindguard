
"use client";

import AuthWrapper from '@/components/AuthWrapper';
import InventoryList from '@/components/inventory/InventoryList';
import { getMedicinesFromFirestore, type Medicine } from '@/lib/medicineService'; // Updated import
import { Button } from '@/components/ui/button';
import { Boxes, RotateCw } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadMedicines = useCallback(async (showToast = false) => {
    setIsLoading(true);
    try {
      const firestoreMedicines = await getMedicinesFromFirestore();
      setMedicines(firestoreMedicines);
      if (showToast) {
        toast({
          title: "Bindcards Actualizados",
          description: "La lista de medicamentos ha sido recargada desde la base de datos.",
          variant: 'success'
        });
      }
    } catch (error) {
      console.error("Failed to load medicines from Firestore:", error);
      toast({
        title: "Error al Cargar Bindcards",
        description: error instanceof Error ? error.message : "No se pudo obtener la lista desde Firestore.",
        variant: "destructive",
      });
      setMedicines([]); // Clear medicines on error
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  if (isLoading && medicines.length === 0) { // Show skeleton only on initial load without data
    return (
      <AuthWrapper>
        <div className="mb-7 flex items-end justify-between border-b pb-6">
          <div>
            <p className="eyebrow">Inventario</p>
            <h1 className="page-heading mt-2">Bindcards</h1>
          </div>
          <Button variant="outline" disabled aria-label="Actualizando Bindcards">
            <RotateCw className="mr-2 h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">Actualizando</span>
          </Button>
        </div>
        <div className="space-y-8">
          <Skeleton className="h-10 w-full max-w-lg mx-auto" /> {/* Search bar skeleton */}
          <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <header className="mb-7 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Inventario</p>
          <h1 className="page-heading mt-2">Bindcards</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {medicines.length} {medicines.length === 1 ? 'medicamento registrado' : 'medicamentos registrados'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadMedicines(true)}
          aria-label="Refrescar lista de Bindcards"
          title="Refrescar Bindcards"
          disabled={isLoading}
        >
          <RotateCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </header>
      <div className="space-y-6">
        { !isLoading && medicines.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-card p-8 text-center">
            <Boxes className="h-8 w-8 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">No hay Bindcards disponibles</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Actualiza la lista o verifica la conexión con Firestore.
            </p>
          </div>
        )}
        <InventoryList medicines={medicines} />
      </div>
    </AuthWrapper>
  );
}
