
// This file is being phased out for medicine data management.
// Medicine data is now handled by src/lib/medicineService.ts and Firestore.

// Interfaces might still be useful if shared, or can be moved/duplicated.
// For now, keeping them here but marking related functions/data as deprecated or removed.

export interface DispensingRecord {
  id: string;
  date: string; // Or Timestamp if directly from Firestore, string if for display/input
  rxNumber: string;
  quantity: number;
  type: 'dispensed' | 'stocked';
  userName?: string;
  expirationDate?: string; // Or Timestamp
}

export interface Medicine {
  id: string;
  name: string;
  presentation: string;
  description?: string;
  currentStock: number;
  lastUpdated: string; // Or Timestamp
  dispensingHistory: DispensingRecord[];
}

// const MEDICINES_LOCAL_STORAGE_KEY = 'bindguard_medicines_v1'; // Deprecated
// export const mockMedicines: Medicine[] = []; // Deprecated, moved to medicineService.ts as mockMedicinesForFirestore

// export function getStoredMedicines(): Medicine[] { // Deprecated
//   console.warn("getStoredMedicines from placeholder-data.ts is deprecated. Use Firestore via medicineService.ts.");
//   return [];
// }

// export function saveStoredMedicines(medicines: Medicine[]): void { // Deprecated
//   console.warn("saveStoredMedicines from placeholder-data.ts is deprecated. Use Firestore via medicineService.ts.");
// }
