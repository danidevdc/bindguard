import 'server-only';

import { randomUUID } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/server/firebaseAdmin';

const medicineIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/)
  .transform((value) => value.toUpperCase());

const transactionDateSchema = z.string().datetime({ offset: true });

export const inventoryTransactionSchema = z
  .object({
    operationId: z.string().uuid(),
    medicineId: medicineIdSchema,
    quantity: z.number().int().positive().max(1_000_000),
    type: z.enum(['dispensed', 'stocked']),
    rxNumber: z.string().trim().min(1).max(80),
    transactionDate: transactionDateSchema,
    expirationDate: transactionDateSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.type === 'stocked' && !value.expirationDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expirationDate'],
        message: 'La fecha de vencimiento es obligatoria para una entrada.',
      });
    }
  });

export const prescriptionSchema = z
  .object({
    operationId: z.string().uuid(),
    prescriptionNumber: z
      .string()
      .trim()
      .min(1)
      .max(60)
      .regex(/^[a-zA-Z0-9_-]+$/),
    transactionDate: transactionDateSchema,
    medicines: z
      .array(
        z.object({
          medicineId: medicineIdSchema,
          quantity: z.number().int().positive().max(1_000_000),
        })
      )
      .min(1)
      .max(100),
  })
  .superRefine((value, context) => {
    const ids = value.medicines.map((medicine) => medicine.medicineId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['medicines'],
        message: 'Una receta no puede repetir el mismo medicamento.',
      });
    }
  });

export class InventoryApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
    this.name = 'InventoryApiError';
  }
}

interface AuthenticatedOperator {
  uid: string;
  userName: string;
}

interface MedicineDocument {
  name?: string;
  currentStock?: number;
  isBlocked?: boolean;
}

export async function requireInventoryOperator(request: Request): Promise<AuthenticatedOperator> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new InventoryApiError('Debes iniciar sesión para realizar esta operación.', 401, 'UNAUTHENTICATED');
  }

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(authorization.slice(7), true);
  } catch {
    throw new InventoryApiError('La sesión no es válida o expiró.', 401, 'INVALID_TOKEN');
  }

  const userSnapshot = await adminDb.collection('users').doc(decodedToken.uid).get();
  if (!userSnapshot.exists) {
    throw new InventoryApiError('El usuario no tiene un perfil operativo habilitado.', 403, 'PROFILE_REQUIRED');
  }

  const profile = userSnapshot.data() ?? {};
  const role = typeof profile.role === 'string' ? profile.role : null;
  const canOperate =
    profile.isAdmin === true || role === 'admin' || role === 'operator';
  if (!canOperate) {
    throw new InventoryApiError(
      'Tu perfil no tiene permiso para modificar el inventario.',
      403,
      'INVENTORY_PERMISSION_REQUIRED'
    );
  }

  const firstName = typeof profile.firstName === 'string' ? profile.firstName.trim() : '';
  const lastName = typeof profile.lastName === 'string' ? profile.lastName.trim() : '';
  const userName =
    [firstName, lastName].filter(Boolean).join('.').toLowerCase() ||
    decodedToken.email ||
    decodedToken.uid;

  return { uid: decodedToken.uid, userName };
}

function validateTransactionDate(value: string): Timestamp {
  const date = new Date(value);
  if (date.getTime() > Date.now() + 5 * 60 * 1000) {
    throw new InventoryApiError('La fecha de la operación no puede estar en el futuro.', 400, 'INVALID_DATE');
  }
  return Timestamp.fromDate(date);
}

function validateStock(data: MedicineDocument, medicineId: string): number {
  if (!Number.isSafeInteger(data.currentStock) || (data.currentStock ?? -1) < 0) {
    throw new InventoryApiError(
      `El stock almacenado para ${medicineId} no es válido.`,
      409,
      'INVALID_STOCK'
    );
  }
  return data.currentStock as number;
}

export async function applyInventoryTransaction(
  input: z.infer<typeof inventoryTransactionSchema>,
  operator: AuthenticatedOperator
) {
  const transactionDate = validateTransactionDate(input.transactionDate);
  const expirationDate = input.expirationDate
    ? Timestamp.fromDate(new Date(input.expirationDate))
    : undefined;

  if (expirationDate && expirationDate.toMillis() <= Date.now()) {
    throw new InventoryApiError(
      'La fecha de vencimiento debe ser futura.',
      400,
      'INVALID_EXPIRATION_DATE'
    );
  }

  const medicineRef = adminDb.collection('medicines').doc(input.medicineId);
  const operationRef = adminDb.collection('inventoryOperations').doc(input.operationId);

  return adminDb.runTransaction(async (transaction) => {
    const [operationSnapshot, medicineSnapshot] = await Promise.all([
      transaction.get(operationRef),
      transaction.get(medicineRef),
    ]);

    if (operationSnapshot.exists) {
      return {
        duplicate: true,
        currentStock: operationSnapshot.get('resultingStock') as number,
      };
    }

    if (!medicineSnapshot.exists) {
      throw new InventoryApiError('El medicamento no existe.', 404, 'MEDICINE_NOT_FOUND');
    }

    const medicine = medicineSnapshot.data() as MedicineDocument;
    if (medicine.isBlocked) {
      throw new InventoryApiError('El medicamento está cerrado.', 409, 'MEDICINE_BLOCKED');
    }

    const currentStock = validateStock(medicine, input.medicineId);
    const resultingStock =
      input.type === 'dispensed'
        ? currentStock - input.quantity
        : currentStock + input.quantity;

    if (resultingStock < 0) {
      throw new InventoryApiError(
        `Stock insuficiente. Disponible: ${currentStock}.`,
        409,
        'INSUFFICIENT_STOCK'
      );
    }

    const record = {
      id: randomUUID(),
      date: transactionDate,
      rxNumber: input.rxNumber,
      quantity: input.quantity,
      type: input.type,
      userName: operator.userName,
      ...(expirationDate ? { expirationDate } : {}),
    };

    transaction.update(medicineRef, {
      currentStock: resultingStock,
      dispensingHistory: FieldValue.arrayUnion(record),
      lastUpdated: FieldValue.serverTimestamp(),
    });
    transaction.create(operationRef, {
      uid: operator.uid,
      medicineId: input.medicineId,
      type: input.type,
      quantity: input.quantity,
      rxNumber: input.rxNumber,
      resultingStock,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { duplicate: false, currentStock: resultingStock };
  });
}

export async function dispensePrescription(
  input: z.infer<typeof prescriptionSchema>,
  operator: AuthenticatedOperator
) {
  const transactionDate = validateTransactionDate(input.transactionDate);
  const prescriptionRef = adminDb
    .collection('prescriptions')
    .doc(input.prescriptionNumber);
  const operationRef = adminDb.collection('inventoryOperations').doc(input.operationId);
  const medicineRefs = input.medicines.map((medicine) =>
    adminDb.collection('medicines').doc(medicine.medicineId)
  );

  return adminDb.runTransaction(async (transaction) => {
    const [operationSnapshot, prescriptionSnapshot, ...medicineSnapshots] =
      await transaction.getAll(operationRef, prescriptionRef, ...medicineRefs);

    if (operationSnapshot.exists) {
      return { duplicate: true, processed: input.medicines.length };
    }

    if (prescriptionSnapshot.exists) {
      throw new InventoryApiError(
        'Esta receta ya fue procesada.',
        409,
        'PRESCRIPTION_ALREADY_PROCESSED'
      );
    }

    const updates = input.medicines.map((item, index) => {
      const snapshot = medicineSnapshots[index];
      if (!snapshot.exists) {
        throw new InventoryApiError(
          `El medicamento ${item.medicineId} no existe.`,
          404,
          'MEDICINE_NOT_FOUND'
        );
      }

      const medicine = snapshot.data() as MedicineDocument;
      if (medicine.isBlocked) {
        throw new InventoryApiError(
          `El medicamento ${medicine.name || item.medicineId} está cerrado.`,
          409,
          'MEDICINE_BLOCKED'
        );
      }

      const currentStock = validateStock(medicine, item.medicineId);
      if (currentStock < item.quantity) {
        throw new InventoryApiError(
          `Stock insuficiente para ${medicine.name || item.medicineId}. Disponible: ${currentStock}.`,
          409,
          'INSUFFICIENT_STOCK'
        );
      }

      return {
        ref: snapshot.ref,
        resultingStock: currentStock - item.quantity,
        record: {
          id: randomUUID(),
          date: transactionDate,
          rxNumber: input.prescriptionNumber,
          quantity: item.quantity,
          type: 'dispensed',
          userName: operator.userName,
        },
      };
    });

    updates.forEach((update) => {
      transaction.update(update.ref, {
        currentStock: update.resultingStock,
        dispensingHistory: FieldValue.arrayUnion(update.record),
        lastUpdated: FieldValue.serverTimestamp(),
      });
    });

    transaction.create(prescriptionRef, {
      prescriptionNumber: input.prescriptionNumber,
      operationId: input.operationId,
      uid: operator.uid,
      userName: operator.userName,
      transactionDate,
      status: 'confirmed',
      medicines: input.medicines,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.create(operationRef, {
      uid: operator.uid,
      type: 'prescription',
      prescriptionNumber: input.prescriptionNumber,
      itemCount: input.medicines.length,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { duplicate: false, processed: input.medicines.length };
  });
}
