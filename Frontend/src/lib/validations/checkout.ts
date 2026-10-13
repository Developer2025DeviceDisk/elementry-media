import { z } from 'zod';
import { addressSchema } from './address';
export const checkoutSchema = z.object({
  address: addressSchema,
  shippingMethod: z.enum(['standard', 'express']),
  idempotencyKey: z.uuid(),
});
