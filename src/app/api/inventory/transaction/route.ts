import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  applyInventoryTransaction,
  inventoryTransactionSchema,
  InventoryApiError,
  requireInventoryOperator,
} from '@/lib/server/inventory';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const operator = await requireInventoryOperator(request);
    const input = inventoryTransactionSchema.parse(await request.json());
    const result = await applyInventoryTransaction(input, operator);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof InventoryApiError) {
      return NextResponse.json(
        { ok: false, code: error.code, error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', error: 'Los datos enviados no son válidos.' },
        { status: 400 }
      );
    }

    console.error('Inventory transaction failed:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', error: 'No se pudo completar la operación.' },
      { status: 500 }
    );
  }
}
