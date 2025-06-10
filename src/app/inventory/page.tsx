
"use client";

import AuthWrapper from '@/components/AuthWrapper';
import InventoryList from '@/components/inventory/InventoryList';
import { getStoredMedicines, type Medicine } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCw } from 'lucide-react'; // Added RotateCw for refresh
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadMedicines = () => {
    setIsLoading(true);
    // Simulate a small delay for loading perception if needed, or remove for instant load
    // setTimeout(() => {
      const storedMeds = getStoredMedicines();
      setMedicines(storedMeds);
      setIsLoading(false);
    // }, 200); 
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  if (isLoading) {
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
            onClick={loadMedicines}
            aria-label="Refrescar lista de inventario"
            disabled
          >
            <RotateCw className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-8">
          <Skeleton className="h-10 w-1/2 mx-auto" /> {/* Search bar skeleton */}
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
          onClick={loadMedicines}
          aria-label="Refrescar lista de inventario"
          title="Refrescar Inventario"
          className="hover:bg-accent hover:text-accent-foreground"
        >
          <RotateCw className="h-5 w-5" />
        </Button>
      </div>
      <div className="space-y-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground text-center">Inventario General</h2>
        <InventoryList medicines={medicines} />
      </div>
    </AuthWrapper>
  );
}
