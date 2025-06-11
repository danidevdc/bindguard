
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  arrayUnion,
  serverTimestamp,
  query,
  where,
  // increment, // Not used currently, can be removed if not planned
  runTransaction
} from 'firebase/firestore';

export interface DispensingRecord {
  id: string;
  date: Timestamp; 
  rxNumber: string;
  quantity: number;
  type: 'dispensed' | 'stocked';
  userName?: string;
  expirationDate?: Timestamp; 
}

export interface Medicine {
  id: string; // Firestore document ID will be this id
  name: string;
  presentation: string;
  description?: string;
  currentStock: number;
  lastUpdated: Timestamp; 
  dispensingHistory: DispensingRecord[];
}

export const mockMedicinesForFirestore: Omit<Medicine, 'lastUpdated' | 'dispensingHistory'> & { dispensingHistory: Omit<DispensingRecord, 'date' | 'expirationDate' | 'id'> & { id?: string, date: string, expirationDate?: string}[] }[] = [
  {
    id: 'MED001',
    name: 'Amoxicillin 250mg Capsules',
    presentation: 'Capsules',
    description: 'Broad-spectrum antibiotic',
    currentStock: 0, 
    dispensingHistory: [
      { id: 'hist000_init_MED001', date: '2024-07-20', rxNumber: 'alm765', quantity: 100, type: 'stocked', userName: 'laura.perez', expirationDate: '2025-12-31' },
    ],
  },
  {
    id: 'MED002',
    name: 'Paracetamol 500mg Tablets',
    presentation: 'Tablets',
    description: 'Analgesic and antipyretic',
    currentStock: 0,
    dispensingHistory: [
      { id: 'hist000_init_MED002', date: '2024-07-24', rxNumber: 'alm123', quantity: 200, type: 'stocked', userName: 'juan.diaz', expirationDate: '2025-10-31' },
    ],
  },
  {
    id: 'MED003',
    name: 'Lisinopril 10mg Tablets',
    presentation: 'Tablets',
    description: 'ACE inhibitor for hypertension',
    currentStock: 0,
    dispensingHistory: [
       { id: 'hist007_init_MED003', date: '2024-07-20', rxNumber: 'alm003', quantity: 100, type: 'stocked', userName: 'elena.sanchez', expirationDate: '2025-07-31' },
    ],
  },
    {
    id: 'A0202',
    name: 'Omeprazol 20mg',
    presentation: 'Capsules',
    description: 'Proton pump inhibitor',
    currentStock: 0,
    dispensingHistory: [
       { id: 'hist_A0202_init', date: '2024-07-01', rxNumber: 'alm_A0202', quantity: 500, type: 'stocked', userName: 'admin.admin', expirationDate: '2026-01-01' },
    ],
  }
];

export async function initializeDefaultMedicines(): Promise<void> {
  if (!db) {
    console.error("Firestore instance (db) is not available for initializing medicines.");
    return;
  }
  try {
    const medicinesRef = collection(db, 'medicines');
    const medicinesSnapshot = await getDocs(medicinesRef);

    if (medicinesSnapshot.empty) {
      const batch = writeBatch(db);
      mockMedicinesForFirestore.forEach(medMock => {
        const medDocRef = doc(medicinesRef, medMock.id);
        
        let initialStock = 0;
        const historyForFirestore: DispensingRecord[] = medMock.dispensingHistory.map((h, index) => {
          if (h.type === 'stocked') initialStock += h.quantity;
          else if (h.type === 'dispensed') initialStock -= h.quantity;

          return {
            ...h,
            id: h.id || `hist_init_${medMock.id}_${index}_${Date.now()}`, // Ensure ID for history
            date: Timestamp.fromDate(new Date(h.date)),
            expirationDate: h.expirationDate ? Timestamp.fromDate(new Date(h.expirationDate)) : undefined,
          };
        });

        const medicineData: Medicine = {
          id: medMock.id,
          name: medMock.name,
          presentation: medMock.presentation,
          description: medMock.description || '',
          currentStock: initialStock, 
          lastUpdated: serverTimestamp() as Timestamp,
          dispensingHistory: historyForFirestore,
        };
        batch.set(medDocRef, medicineData);
      });
      await batch.commit();
      console.log('Default medicines (mockMedicinesForFirestore) created in Firestore.');
    }
  } catch (error) {
    console.error('Error initializing default medicines in Firestore:', error);
  }
}

export async function getMedicinesFromFirestore(): Promise<Medicine[]> {
  if (!db) throw new Error("Firestore not initialized");
  const medicinesCol = collection(db, 'medicines');
  const snapshot = await getDocs(medicinesCol);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Medicine));
}

export async function getMedicineByIdFromFirestore(id: string): Promise<Medicine | null> {
  if (!db) throw new Error("Firestore not initialized");
  if (!id) return null; // Prevent querying with empty ID
  const medDocRef = doc(db, 'medicines', id.toUpperCase()); // Ensure ID is uppercase for lookup
  const docSnap = await getDoc(medDocRef);
  if (docSnap.exists()) {
    return { ...docSnap.data(), id: docSnap.id } as Medicine;
  }
  return null;
}

// Function to save a fully constructed Medicine object, used by AddMedicinePage
export async function createCompleteMedicineInFirestore(medicineData: Medicine): Promise<void> {
  if (!db) {
    throw new Error("Firestore not initialized. Cannot save medicine.");
  }
  if (!medicineData || !medicineData.id) {
    throw new Error("Invalid medicine data or ID missing for saving to Firestore.");
  }
  const medDocRef = doc(db, 'medicines', medicineData.id);
  await setDoc(medDocRef, medicineData);
}


export async function updateMedicineStockInFirestore(
  medicineId: string,
  quantityChange: number,
  transactionType: 'dispensed' | 'stocked',
  rxNumber: string,
  userName: string,
  transactionDate: Timestamp, // Added transactionDate parameter
  expirationDateForStock?: Timestamp 
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const medDocRef = doc(db, 'medicines', medicineId);

  try {
    await runTransaction(db, async (transaction) => {
      const medDoc = await transaction.get(medDocRef);
      if (!medDoc.exists()) {
        throw new Error(`Medicamento con ID ${medicineId} no encontrado.`);
      }

      const medicineData = medDoc.data() as Medicine;
      let newStock = medicineData.currentStock;

      if (transactionType === 'dispensed') {
        if (newStock < quantityChange) {
          throw new Error(`Stock insuficiente para ${medicineData.name}. Stock actual: ${newStock}, se requieren: ${quantityChange}.`);
        }
        newStock -= quantityChange;
      } else { // stocked
        newStock += quantityChange;
        if (!expirationDateForStock && quantityChange > 0) {
            throw new Error("La fecha de expiración es requerida para añadir stock.");
        }
      }

      const newRecord: DispensingRecord = {
        id: `${transactionType}_${medicineId}_${Date.now()}`,
        date: transactionDate, // Use provided transactionDate
        rxNumber,
        quantity: quantityChange,
        type: transactionType,
        userName,
        expirationDate: transactionType === 'stocked' ? expirationDateForStock : undefined, // For dispensed, exp date is on the lot, not this record itself. Store on stock entries.
      };
      
      transaction.update(medDocRef, {
        currentStock: newStock,
        dispensingHistory: arrayUnion(newRecord),
        lastUpdated: serverTimestamp()
      });
    });
  } catch (error) {
    console.error("Error updating medicine stock in transaction:", error);
    throw error; 
  }
}

export async function deleteMedicineFromFirestore(medicineId: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const medDocRef = doc(db, 'medicines', medicineId);
  await deleteDoc(medDocRef);
}


export async function updateMedicineDetailsInFirestore(
  medicineId: string,
  newName: string,
  newPresentation: string
): Promise<void> {
  if (!db) {
    throw new Error("Firestore not initialized. Cannot update medicine details.");
  }
  if (!medicineId || !newName.trim() || !newPresentation.trim()) {
    throw new Error("ID del medicamento, nuevo nombre y nueva presentación son requeridos para actualizar.");
  }
  const medDocRef = doc(db, 'medicines', medicineId); // ID is already uppercase from search
  await updateDoc(medDocRef, {
    name: newName.trim(),
    presentation: newPresentation.trim(),
    lastUpdated: serverTimestamp()
  });
}

// This function is DEPRECATED as AddMedicinePage now uses createCompleteMedicineInFirestore
// export async function addMedicineToFirestore(medicine: Omit<Medicine, 'id' | 'lastUpdated' | 'currentStock' | 'dispensingHistory'>, initialStock: number, expirationDate?: Date, userName?: string): Promise<string> {
//   if (!db) throw new Error("Firestore not initialized");
  
//   const medicineId = medicine.name.trim().toUpperCase().replace(/\s+/g, '_').slice(0,10) + "_" + Date.now().toString().slice(-5);

//   const existingMedicineQuery = query(collection(db, 'medicines'), where('name', '==', medicine.name.trim()));
//   const querySnapshot = await getDocs(existingMedicineQuery);
//   if (!querySnapshot.empty) {
//     throw new Error(`Ya existe un medicamento con el nombre: ${medicine.name.trim()}`);
//   }
  
//   const dispensingHistory: DispensingRecord[] = [];
//   if (initialStock > 0) {
//     if (!expirationDate) {
//       throw new Error("La fecha de expiración es requerida si se ingresa stock inicial.");
//     }
//     dispensingHistory.push({
//       id: `stock_init_${medicineId}_${Date.now()}`,
//       date: Timestamp.now(),
//       rxNumber: 'STOCK-INICIAL',
//       quantity: initialStock,
//       type: 'stocked',
//       userName: userName || 'admin.admin',
//       expirationDate: Timestamp.fromDate(expirationDate),
//     });
//   }

//   const newMedicineData: Medicine = {
//     id: medicineId,
//     name: medicine.name.trim(),
//     presentation: medicine.presentation.trim(),
//     description: medicine.description?.trim() || '',
//     currentStock: initialStock,
//     lastUpdated: serverTimestamp() as Timestamp,
//     dispensingHistory: dispensingHistory,
//   };

//   await setDoc(doc(db, 'medicines', medicineId), newMedicineData);
//   return medicineId;
// }
