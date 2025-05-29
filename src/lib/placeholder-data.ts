
export interface DispensingRecord {
  id: string;
  date: string;
  rxNumber: string; // Could be prescription number or stock intake ID
  quantity: number;
  type: 'dispensed' | 'stocked';
  userName?: string; // User who performed the transaction
  expirationDate?: string; // Expiration date for stocked items AND for dispensed items (from the lot it was taken)
}

export interface Medicine {
  id: string;
  name: string;
  description?: string;
  currentStock: number;
  lastUpdated: string;
  dispensingHistory: DispensingRecord[];
}

// Note: For dispensed items, expirationDate is manually set to simulate FEFO for display.
// In a real system, this would be derived from lot management.
export const mockMedicines: Medicine[] = [
  {
    id: 'MED001',
    name: 'Amoxicillin 250mg Capsules',
    description: 'Broad-spectrum antibiotic',
    currentStock: 130, 
    lastUpdated: '2024-07-28',
    dispensingHistory: [
      { id: 'hist000_init_MED001', date: '2024-07-20', rxNumber: 'STK000', quantity: 100, type: 'stocked', userName: 'laura.perez', expirationDate: '2025-12-31' },
      { id: 'hist003', date: '2024-07-22', rxNumber: 'RX12300', quantity: 50, type: 'dispensed', userName: 'carlos.gomez', expirationDate: '2025-12-31' }, // Taken from STK000
      { id: 'hist002', date: '2024-07-25', rxNumber: 'STK001', quantity: 100, type: 'stocked', userName: 'ana.martinez', expirationDate: '2026-06-30' },
      { id: 'hist001', date: '2024-07-28', rxNumber: 'RX12345', quantity: 20, type: 'dispensed', userName: 'carlos.gomez', expirationDate: '2025-12-31' }, // Taken from remaining STK000
    ],
  },
  {
    id: 'MED002',
    name: 'Paracetamol 500mg Tablets',
    description: 'Analgesic and antipyretic',
    currentStock: 250, 
    lastUpdated: '2024-07-27',
    dispensingHistory: [
      { id: 'hist000_init_MED002', date: '2024-07-24', rxNumber: 'STK000B', quantity: 200, type: 'stocked', userName: 'juan.diaz', expirationDate: '2025-10-31' },
      { id: 'hist005', date: '2024-07-26', rxNumber: 'STK002', quantity: 100, type: 'stocked', userName: 'sofia.vargas', expirationDate: '2026-08-31' },
      { id: 'hist004', date: '2024-07-27', rxNumber: 'RX54321', quantity: 50, type: 'dispensed', userName: 'martin.lopez', expirationDate: '2025-10-31' }, // Taken from STK000B (earlier exp)
    ],
  },
  {
    id: 'MED003',
    name: 'Lisinopril 10mg Tablets',
    description: 'ACE inhibitor for hypertension',
    currentStock: 75,
    lastUpdated: '2024-07-29',
    dispensingHistory: [
      { id: 'hist007', date: '2024-07-20', rxNumber: 'STK003', quantity: 100, type: 'stocked', userName: 'elena.sanchez', expirationDate: '2025-07-31' },
      { id: 'hist006', date: '2024-07-29', rxNumber: 'RX00789', quantity: 25, type: 'dispensed', userName: 'carlos.gomez', expirationDate: '2025-07-31' }, // Taken from STK003
    ],
  },
  {
    id: 'MED004',
    name: 'Salbutamol Inhaler 100mcg',
    description: 'Bronchodilator for asthma',
    currentStock: 40, 
    lastUpdated: '2024-07-28',
    dispensingHistory: [
        { id: 'hist010', date: '2024-07-25', rxNumber: 'STK004', quantity: 50, type: 'stocked', userName: 'laura.perez', expirationDate: '2026-01-31' },
        { id: 'hist009', date: '2024-07-27', rxNumber: 'RX11220', quantity: 5, type: 'dispensed', userName: 'martin.lopez', expirationDate: '2026-01-31' }, // Taken from STK004
        { id: 'hist008', date: '2024-07-28', rxNumber: 'RX11223', quantity: 5, type: 'dispensed', userName: 'martin.lopez', expirationDate: '2026-01-31' }, // Taken from STK004
    ]
  },
  {
    id: 'MED005',
    name: 'Omeprazole 20mg Capsules',
    description: 'Proton pump inhibitor',
    currentStock: 8, 
    lastUpdated: '2024-07-30',
    dispensingHistory: [
        { id: 'hist012', date: '2024-07-28', rxNumber: 'STK005', quantity: 18, type: 'stocked', userName: 'sofia.vargas', expirationDate: '2025-05-31'},
        { id: 'hist011', date: '2024-07-30', rxNumber: 'RX99887', quantity: 10, type: 'dispensed', userName: 'carlos.gomez', expirationDate: '2025-05-31' }, // Taken from STK005
    ]
  }
];
