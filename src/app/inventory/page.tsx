import AuthWrapper from '@/components/AuthWrapper';
import InventoryList from '@/components/inventory/InventoryList';
import { mockMedicines } from '@/lib/placeholder-data'; // Import mock data

export default function InventoryPage() {
  // In a real app, data would be fetched from an API
  const medicines = mockMedicines;

  return (
    <AuthWrapper>
      <div className="space-y-8">
        <h2 className="text-3xl font-semibold text-foreground text-center">Inventory Overview</h2>
        <InventoryList medicines={medicines} />
      </div>
    </AuthWrapper>
  );
}
