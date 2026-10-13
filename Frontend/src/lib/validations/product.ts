import { z } from 'zod';
export const productSchema = z.object({
  name: z.string().trim().min(1).max(200),
  sku: z.string().trim().min(1).max(64),
  description: z.string().max(5000),
  price: z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, 'Enter a valid price.'),
  currency: z.string().regex(/^[A-Z]{3}$/),
  stock: z.number().int().min(0),
  active: z.boolean(),
});
export const categorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens.'),
});
