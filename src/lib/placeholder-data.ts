export interface DispensingRecord {
  id: string;
  date: string;
  rxNumber: string; // Could be prescription number or stock intake ID
  quantity: number;
  type: 'dispensed' | 'stocked';
  userName?: string; // User who performed the transaction
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
    currentStock: 130,
    lastUpdated: '2024-07-28',
    dispensingHistory: [
      { id: 'hist001', date: '2024-07-28', rxNumber: 'RX12345', quantity: 20, type: 'dispensed', userName: 'user1' },
      { id: 'hist002', date: '2024-07-25', rxNumber: 'STK001', quantity: 100, type: 'stocked', userName: 'admin' },
      { id: 'hist003', date: '2024-07-22', rxNumber: 'RX12300', quantity: 50, type: 'dispensed', userName: 'user1' },
    ],
  },
  {
    id: 'MED002',
    name: 'Paracetamol 500mg Tablets',
    description: 'Analgesic and antipyretic',
    currentStock: 250,
    lastUpdated: '2024-07-27',
    dispensingHistory: [
      { id: 'hist004', date: '2024-07-27', rxNumber: 'RX54321', quantity: 50, type: 'dispensed', userName: 'user2' },
      { id: 'hist005', date: '2024-07-26', rxNumber: 'STK002', quantity: 200, type: 'stocked', userName: 'admin' },
    ],
  },
  {
    id: 'MED003',
    name: 'Lisinopril 10mg Tablets',
    description: 'ACE inhibitor for hypertension',
    currentStock: 75,
    lastUpdated: '2024-07-29',
    dispensingHistory: [
      { id: 'hist006', date: '2024-07-29', rxNumber: 'RX00789', quantity: 25, type: 'dispensed', userName: 'user1' },
      { id: 'hist007', date: '2024-07-20', rxNumber: 'STK003', quantity: 100, type: 'stocked', userName: 'admin' },
    ],
  },
  {
    id: 'MED004',
    name: 'Salbutamol Inhaler 100mcg',
    description: 'Bronchodilator for asthma',
    currentStock: 40,
    lastUpdated: '2024-07-28',
    dispensingHistory: [
        { id: 'hist008', date: '2024-07-28', rxNumber: 'RX11223', quantity: 5, type: 'dispensed', userName: 'user2' },
        { id: 'hist009', date: '2024-07-27', rxNumber: 'RX11220', quantity: 5, type: 'dispensed', userName: 'user2' },
        { id: 'hist010', date: '2024-07-25', rxNumber: 'STK004', quantity: 50, type: 'stocked', userName: 'admin' },
    ]
  },
  {
    id: 'MED005',
    name: 'Omeprazole 20mg Capsules',
    description: 'Proton pump inhibitor',
    currentStock: 8, // Low stock example
    lastUpdated: '2024-07-30',
    dispensingHistory: [
        { id: 'hist011', date: '2024-07-30', rxNumber: 'RX99887', quantity: 10, type: 'dispensed', userName: 'user1' },
        { id: 'hist012', date: '2024-07-28', rxNumber: 'STK005', quantity: 18, type: 'stocked', userName: 'admin' }, // Stocked to be 18, then 10 dispensed
    ]
  }
];
