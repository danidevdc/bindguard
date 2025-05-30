
"use client";

import AuthWrapper from '@/components/AuthWrapper';
import InventoryList from '@/components/inventory/InventoryList';
import { mockMedicines } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InventoryPage() {
  const medicines = mockMedicines;
  const router = useRouter();

  return (
    <AuthWrapper>
      <div className="mb-6">
        <Button
          variant="default"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => router.back()}
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="space-y-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground text-center">Inventory Overview</h2>
        <InventoryList medicines={medicines} />
      </div>
    </AuthWrapper>
  );
}
