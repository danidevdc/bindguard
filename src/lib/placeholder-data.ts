
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
    currentStock: 2000, // Updated: 100 - 50 + 100 - 20 + 1500 - 1000 + 2000 - 500 - 30 = 2000
    lastUpdated: '2024-08-05', // Updated
    dispensingHistory: [
      { id: 'hist000_init_MED001', date: '2024-07-20', rxNumber: 'alm765', quantity: 100, type: 'stocked', userName: 'laura.perez', expirationDate: '2025-12-31' },
      { id: 'hist003', date: '2024-07-22', rxNumber: '433209', quantity: 50, type: 'dispensed', userName: 'carlos.gomez', expirationDate: '2025-12-31' },
      { id: 'hist002', date: '2024-07-25', rxNumber: 'alm221', quantity: 100, type: 'stocked', userName: 'ana.martinez', expirationDate: '2026-06-30' },
      { id: 'hist001', date: '2024-07-28', rxNumber: '87650012', quantity: 20, type: 'dispensed', userName: 'carlos.gomez', expirationDate: '2025-12-31' },
      { id: 'hist_med001_005', date: '2024-07-29', rxNumber: 'alm500', quantity: 1500, type: 'stocked', userName: 'ana.martinez', expirationDate: '2027-01-31' },
      { id: 'hist_med001_006', date: '2024-07-30', rxNumber: '700123', quantity: 1000, type: 'dispensed', userName: 'carlos.gomez', expirationDate: '2025-12-31' },
      { id: 'hist_med001_007', date: '2024-08-01', rxNumber: 'alm501', quantity: 2000, type: 'stocked', userName: 'laura.perez', expirationDate: '2027-07-30'},
      { id: 'hist_med001_008', date: '2024-08-03', rxNumber: '700125', quantity: 500, type: 'dispensed', userName: 'carlos.gomez', expirationDate: '2026-06-30' },
      { id: 'hist_med001_009', date: '2024-08-04', rxNumber: '700126', quantity: 30, type: 'dispensed', userName: 'martin.lopez', expirationDate: '2026-06-30' },
      { id: 'hist_med001_010', date: '2024-08-05', rxNumber: '700128', quantity: 100, type: 'dispensed', userName: 'ana.martinez', expirationDate: '2027-01-31'},
    ],
  },
  {
    id: 'MED002',
    name: 'Paracetamol 500mg Tablets',
    description: 'Analgesic and antipyretic',
    currentStock: 1700, // Updated: 200 + 100 - 50 + 2000 - 300 - 150 + 500 - 100 = 1700
    lastUpdated: '2024-08-06', // Updated
    dispensingHistory: [
      { id: 'hist000_init_MED002', date: '2024-07-24', rxNumber: 'alm123', quantity: 200, type: 'stocked', userName: 'juan.diaz', expirationDate: '2025-10-31' },
      { id: 'hist005', date: '2024-07-26', rxNumber: 'alm876', quantity: 100, type: 'stocked', userName: 'sofia.vargas', expirationDate: '2026-08-31' },
      { id: 'hist004', date: '2024-07-27', rxNumber: '22193170', quantity: 50, type: 'dispensed', userName: 'martin.lopez', expirationDate: '2025-10-31' },
      { id: 'hist_med002_004', date: '2024-07-28', rxNumber: 'alm050', quantity: 2000, type: 'stocked', userName: 'juan.diaz', expirationDate: '2027-03-15'},
      { id: 'hist_med002_005', date: '2024-07-29', rxNumber: '33100250', quantity: 300, type: 'dispensed', userName: 'laura.perez', expirationDate: '2025-10-31'},
      { id: 'hist_med002_006', date: '2024-07-30', rxNumber: '33100251', quantity: 150, type: 'dispensed', userName: 'ana.martinez', expirationDate: '2025-10-31'},
      { id: 'hist_med002_007', date: '2024-08-01', rxNumber: 'alm055', quantity: 500, type: 'stocked', userName: 'sofia.vargas', expirationDate: '2026-11-30'},
      { id: 'hist_med002_008', date: '2024-08-03', rxNumber: '33100258', quantity: 100, type: 'dispensed', userName: 'carlos.gomez', expirationDate: '2026-08-31'},
      { id: 'hist_med002_009', date: '2024-08-05', rxNumber: '33100260', quantity: 200, type: 'dispensed', userName: 'martin.lopez', expirationDate: '2026-08-31'},
      { id: 'hist_med002_010', date: '2024-08-06', rxNumber: '33100261', quantity: 500, type: 'dispensed', userName: 'juan.diaz', expirationDate: '2026-11-30'},
    ],
  },
  {
    id: 'MED003',
    name: 'Lisinopril 10mg Tablets',
    description: 'ACE inhibitor for hypertension',
    currentStock: 75,
    lastUpdated: '2024-07-29',
    dispensingHistory: [
      { id: 'hist007', date: '2024-07-20', rxNumber: 'alm003', quantity: 100, type: 'stocked', userName: 'elena.sanchez', expirationDate: '2025-07-31' },
      { id: 'hist006', date: '2024-07-29', rxNumber: '555666', quantity: 25, type: 'dispensed', userName: 'carlos.gomez', expirationDate: '2025-07-31' },
    ],
  },
  {
    id: 'MED004',
    name: 'Salbutamol Inhaler 100mcg',
    description: 'Bronchodilator for asthma',
    currentStock: 40,
    lastUpdated: '2024-07-28',
    dispensingHistory: [
        { id: 'hist010', date: '2024-07-25', rxNumber: 'alm445', quantity: 50, type: 'stocked', userName: 'laura.perez', expirationDate: '2026-01-31' },
        { id: 'hist009', date: '2024-07-27', rxNumber: '112200', quantity: 5, type: 'dispensed', userName: 'martin.lopez', expirationDate: '2026-01-31' },
        { id: 'hist008', date: '2024-07-28', rxNumber: '33440011', quantity: 5, type: 'dispensed', userName: 'martin.lopez', expirationDate: '2026-01-31' },
    ]
  },
  {
    id: 'MED005',
    name: 'Omeprazole 20mg Capsules',
    description: 'Proton pump inhibitor',
    currentStock: 8,
    lastUpdated: '2024-07-30',
    dispensingHistory: [
        { id: 'hist012', date: '2024-07-28', rxNumber: 'alm990', quantity: 18, type: 'stocked', userName: 'sofia.vargas', expirationDate: '2025-05-31'},
        { id: 'hist011', date: '2024-07-30', rxNumber: '998877', quantity: 10, type: 'dispensed', userName: 'carlos.gomez', expirationDate: '2025-05-31' },
    ]
  }
];
