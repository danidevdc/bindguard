
"use client";

import type { Medicine } from '@/lib/medicineService';
import InventoryCard from './InventoryCard';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

interface InventoryListProps {
  medicines: Medicine[];
  isAdminView?: boolean;
  onRefreshNeeded?: () => void;
}

export default function InventoryList({ medicines, isAdminView = false, onRefreshNeeded }: InventoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMedicines = useMemo(() => {
    if (!searchTerm) {
      return medicines;
    }
    return medicines.filter(med =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (med.description && med.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      med.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medicines, searchTerm]);

  if (!medicines || medicines.length === 0) {
    // Message handled in parent pages.
    // For admin view, if medicines array is empty but not loading, parent shows "No hay medicamentos".
    // For user view, similar handling in parent.
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="relative max-w-xl">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por nombre, código o descripción"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          aria-label="Buscar Bindcards"
        />
      </div>
      {filteredMedicines.length > 0 ? (
        <div className="grid grid-cols-1 gap-5">
          {filteredMedicines.map((medicine) => (
            <InventoryCard
              key={medicine.id}
              medicine={medicine}
              isAdminView={isAdminView}
              onRefreshNeeded={onRefreshNeeded}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center">
          <p className="font-semibold">Sin resultados</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No encontramos medicamentos que coincidan con “{searchTerm}”.
          </p>
        </div>
      )}
    </div>
  );
}
