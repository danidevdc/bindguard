
"use client";

import type { Medicine } from '@/lib/medicineService'; // Corrected import
import InventoryCard from './InventoryCard';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

interface InventoryListProps {
  medicines: Medicine[];
}

export default function InventoryList({ medicines }: InventoryListProps) {
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
    // This message is now handled in InventoryPage.tsx for better context.
    // Keeping a fallback here in case InventoryList is used elsewhere directly.
    return <p className="text-center text-muted-foreground">No hay datos de inventario disponibles.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          type="text"
          placeholder="Buscar medicamentos por nombre, ID o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-lg mx-auto pl-10 pr-4 py-2 shadow-sm"
        />
      </div>
      {filteredMedicines.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto"> 
          {filteredMedicines.map((medicine) => (
            <InventoryCard key={medicine.id} medicine={medicine} />
          ))}
        </div>
      ) : (
         <p className="text-center text-muted-foreground py-8">
          No se encontraron medicamentos que coincidan con los criterios de búsqueda.
        </p>
      )}
    </div>
  );
}

