
"use client";

import AuthWrapper from '@/components/AuthWrapper';
import InventoryList from '@/components/inventory/InventoryList';
import { getMedicinesFromFirestore, type Medicine } from '@/lib/medicineService'; // Updated import
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
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
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="default"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => router.back()}
            aria-label="Volver"
            disabled
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
           <Button
            variant="outline"
            onClick={() => loadMedicines(true)}
            aria-label="Refrescar lista de Bindcards"
            disabled
          >
            <RotateCw className="h-5 w-5 animate-spin" />
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
       <div className="mb-6 flex justify-between items-center">
        <Button
          variant="default"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => router.back()}
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
         <Button
          variant="outline"
          onClick={() => loadMedicines(true)} // Pass true to show toast on manual refresh
          aria-label="Refrescar lista de Bindcards"
          title="Refrescar Bindcards"
          className="hover:bg-accent hover:text-accent-foreground"
          disabled={isLoading} // Disable button while loading
        >
          {isLoading ? <RotateCw className="h-5 w-5 animate-spin" /> : <RotateCw className="h-5 w-5" />}
        </Button>
      </div>
      <div className="space-y-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground text-center">Bindcards</h2>
        { !isLoading && medicines.length === 0 && (
          <p className="text-center text-muted-foreground py-10">
            No hay medicamentos en Bindcards o no se pudieron cargar. Intenta refrescar o verifica la conexión y configuración de Firestore.
          </p>
        )}
        <InventoryList medicines={medicines} />
      </div>
    </AuthWrapper>
  );
}
