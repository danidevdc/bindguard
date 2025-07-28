
"use client";

import AuthWrapper from '@/components/AuthWrapper';
import InventoryList from '@/components/inventory/InventoryList';
import { getMedicinesFromFirestore, type Medicine } from '@/lib/medicineService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCw, ShieldAlert, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';

export default function AdminInventoryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { isCurrentUserAdmin, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isCurrentUserAdmin) {
      toast({
        title: 'Acceso Denegado',
        description: 'No tienes permisos para acceder a esta página.',
        variant: 'destructive',
      });
      router.replace('/admin');
    }
  }, [isCurrentUserAdmin, authLoading, router, toast]);

  const loadMedicines = useCallback(async (showToastOnSuccess = false) => {
    setIsLoading(true);
    if (isCurrentUserAdmin) {
      try {
        const firestoreMedicines = await getMedicinesFromFirestore();
        setMedicines(firestoreMedicines);
        if (showToastOnSuccess) {
          toast({
            title: "Bindcards Actualizados",
            description: "La lista de medicamentos ha sido recargada.",
            variant: 'success'
          });
        }
      } catch (error) {
        console.error("Failed to load medicines:", error);
        toast({
          title: "Error al Cargar Bindcards",
          description: error instanceof Error ? error.message : "No se pudo obtener la lista desde Firestore.",
          variant: "destructive",
        });
        setMedicines([]);
      }
    } else {
      // If not admin, ensure we don't keep showing loader indefinitely if auth state changes
      setMedicines([]);
    }
    setIsLoading(false);
  }, [toast, isCurrentUserAdmin]);

  useEffect(() => {
    if (!authLoading) { // Only proceed once auth state is resolved
        if (isCurrentUserAdmin) {
            loadMedicines();
        } else {
            // If not admin and auth is loaded, set loading to false.
            // The redirection is handled by the other useEffect.
            setIsLoading(false);
        }
    }
  }, [loadMedicines, isCurrentUserAdmin, authLoading]);

  if (authLoading || (!isLoading && !isCurrentUserAdmin && medicines.length === 0) ) {
    return (
      <AuthWrapper>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-background">
          <ShieldAlert className="h-16 w-16 text-primary animate-pulse" />
        </div>
      </AuthWrapper>
    );
  }

  if (isLoading && isCurrentUserAdmin) { // Show skeleton only if admin and loading
    return (
      <AuthWrapper>
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="default"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => router.push('/admin')}
            aria-label="Volver al Panel Admin"
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
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground text-center">Gestionar Bindcards (Admin)</h2>
          <Skeleton className="h-10 w-full max-w-lg mx-auto" />
          <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
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
          onClick={() => router.push('/admin')}
          aria-label="Volver al Panel Admin"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
         <Button
          variant="outline"
          onClick={() => loadMedicines(true)}
          aria-label="Refrescar lista de Bindcards"
          title="Refrescar Bindcards"
          className="hover:bg-accent hover:text-accent-foreground"
          disabled={isLoading}
        >
          {isLoading ? <RotateCw className="h-5 w-5 animate-spin" /> : <RotateCw className="h-5 w-5" />}
        </Button>
      </div>
      <div className="space-y-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground text-center">Gestionar Bindcards (Admin)</h2>
        { !isLoading && medicines.length === 0 && isCurrentUserAdmin && (
          <p className="text-center text-muted-foreground py-10">
            No hay medicamentos en Bindcards o no se pudieron cargar.
          </p>
        )}
        { isCurrentUserAdmin && <InventoryList medicines={medicines} isAdminView={true} onRefreshNeeded={() => loadMedicines(false)} /> }
      </div>
    </AuthWrapper>
  );
}
