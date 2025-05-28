export interface DispensingRecord {
  id: string;
  date: string;
  rxNumber: string; // Could be prescription number or stock intake ID
  quantity: number;
  type: 'dispensed' | 'stocked';
  userName?: string; // User who performed the transaction
  expirationDate?: string; // Expiration date for stocked items
}

export interface Medicine {
  id: string;
  name: string;
  description?: string;
  currentStock: number;
  lastUpdated: string;
  dispensingHistory: DispensingRecord[];
}

export const mockMedicines: Medicine[] = [
  {
    id: 'MED001',
    name: 'Amoxicillin 250mg Capsules',
    description: 'Broad-spectrum antibiotic',
    currentStock: 130, // Saldo final: (0 + 100) - 50 + (X) - 20. Inicial: 0. STK003 (100) -> 100. RX12300 (50) -> 50. STK001 (100) -> 150. RX12345 (20) -> 130
    lastUpdated: '2024-07-28',
    dispensingHistory: [
      // Ordered chronologically for saldo calculation demonstration
      { id: 'hist000_init_MED001', date: '2024-07-20', rxNumber: 'STK000', quantity: 100, type: 'stocked', userName: 'admin', expirationDate: '2025-12-31' }, // Initial stock for saldo base
      { id: 'hist003', date: '2024-07-22', rxNumber: 'RX12300', quantity: 50, type: 'dispensed', userName: 'user1' },
      { id: 'hist002', date: '2024-07-25', rxNumber: 'STK001', quantity: 100, type: 'stocked', userName: 'admin', expirationDate: '2026-06-30' },
      { id: 'hist001', date: '2024-07-28', rxNumber: 'RX12345', quantity: 20, type: 'dispensed', userName: 'user1' },
    ],
  },
  {
    id: 'MED002',
    name: 'Paracetamol 500mg Tablets',
    description: 'Analgesic and antipyretic',
    currentStock: 250, // (0+200) - 50 + 100 = 250
    lastUpdated: '2024-07-27',
    dispensingHistory: [
      { id: 'hist000_init_MED002', date: '2024-07-24', rxNumber: 'STK000B', quantity: 200, type: 'stocked', userName: 'admin', expirationDate: '2025-10-31' },
      { id: 'hist005', date: '2024-07-26', rxNumber: 'STK002', quantity: 100, type: 'stocked', userName: 'admin', expirationDate: '2026-08-31' },
      { id: 'hist004', date: '2024-07-27', rxNumber: 'RX54321', quantity: 50, type: 'dispensed', userName: 'user2' },
    ],
  },
  {
    id: 'MED003',
    name: 'Lisinopril 10mg Tablets',
    description: 'ACE inhibitor for hypertension',
    currentStock: 75, // 0 + 100 - 25
    lastUpdated: '2024-07-29',
    dispensingHistory: [
      { id: 'hist007', date: '2024-07-20', rxNumber: 'STK003', quantity: 100, type: 'stocked', userName: 'admin', expirationDate: '2025-07-31' },
      { id: 'hist006', date: '2024-07-29', rxNumber: 'RX00789', quantity: 25, type: 'dispensed', userName: 'user1' },
    ],
  },
  {
    id: 'MED004',
    name: 'Salbutamol Inhaler 100mcg',
    description: 'Bronchodilator for asthma',
    currentStock: 40, // 0 + 50 - 5 - 5
    lastUpdated: '2024-07-28',
    dispensingHistory: [
        { id: 'hist010', date: '2024-07-25', rxNumber: 'STK004', quantity: 50, type: 'stocked', userName: 'admin', expirationDate: '2026-01-31' },
        { id: 'hist009', date: '2024-07-27', rxNumber: 'RX11220', quantity: 5, type: 'dispensed', userName: 'user2' },
        { id: 'hist008', date: '2024-07-28', rxNumber: 'RX11223', quantity: 5, type: 'dispensed', userName: 'user2' },
    ]
  },
  {
    id: 'MED005',
    name: 'Omeprazole 20mg Capsules',
    description: 'Proton pump inhibitor',
    currentStock: 8, // 0 + 18 - 10
    lastUpdated: '2024-07-30',
    dispensingHistory: [
        { id: 'hist012', date: '2024-07-28', rxNumber: 'STK005', quantity: 18, type: 'stocked', userName: 'admin', expirationDate: '2025-05-31'},
        { id: 'hist011', date: '2024-07-30', rxNumber: 'RX99887', quantity: 10, type: 'dispensed', userName: 'user1' },
    ]
  }
];
