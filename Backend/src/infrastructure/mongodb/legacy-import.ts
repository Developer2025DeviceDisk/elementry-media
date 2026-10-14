import { z } from 'zod';
import { Db, MongoClient } from 'mongodb';
import { moneyToDecimal } from './money';
import { OrderDocument, OrderItemDocument, OrderStatus, ProductDocument, Role, UserDocument } from './models';

const id = z.string().uuid();
const date = z.string().datetime({ offset: true }).transform(value => new Date(value));
const money = z.string().transform((value, ctx) => {
  try { return moneyToDecimal(value); }
  catch { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid money' }); return z.NEVER; }
});
const times = { createdAt: date, updatedAt: date };
const currency = z.string().regex(/^[A-Z]{3}$/);
const exportSchema = z.object({
  users: z.array(z.object({ id, email: z.string().email().max(254).transform(v => v.trim().toLowerCase()), name: z.string().min(1).max(100), passwordHash: z.string().min(1).max(1024), role: z.nativeEnum(Role), disabledAt: date.nullable(), ...times }).strict()),
  products: z.array(z.object({ id, sku: z.string().min(1).max(64), name: z.string().min(1).max(200), brand: z.string().trim().min(1).max(100).optional(), description: z.string().nullable(), price: money, currency, stock: z.number().int().min(0).max(2147483647), active: z.boolean(), ...times }).strict()),
  orders: z.array(z.object({ id, userId: id, status: z.nativeEnum(OrderStatus), total: money, currency, idempotencyKey: z.string().min(1).max(128), ...times }).strict()),
  orderItems: z.array(z.object({ id, orderId: id, productId: id, quantity: z.number().int().min(1).max(2147483647), unitPrice: money, sku: z.string().min(1).max(64), name: z.string().min(1).max(200) }).strict()),
}).strict();

export interface LegacyDocuments { users: UserDocument[]; products: ProductDocument[]; orders: OrderDocument[]; orderItems: OrderItemDocument[] }
export function mapLegacyExport(input: unknown): LegacyDocuments {
  const result = exportSchema.safeParse(input);
  if (!result.success) throw new Error('Export validation failed; check fields, timestamps, IDs and monetary strings');
  const parsed = result.data;
  const unique = (values: string[]) => {
    if (new Set(values).size !== values.length) throw new Error('Export contains duplicate IDs or unique keys');
  };
  for (const records of Object.values(parsed)) unique(records.map(record => record.id));
  unique(parsed.users.map(user => user.email));
  unique(parsed.products.map(product => product.sku));
  unique(parsed.orders.map(order => order.idempotencyKey));
  unique(parsed.orderItems.map(item => `${item.orderId}:${item.productId}`));
  const users = new Set(parsed.users.map(user => user.id));
  const products = new Set(parsed.products.map(product => product.id));
  const orders = new Set(parsed.orders.map(order => order.id));
  if (parsed.orders.some(order => !users.has(order.userId)) || parsed.orderItems.some(item => !orders.has(item.orderId) || !products.has(item.productId))) {
    throw new Error('Export contains missing user, product or order references');
  }
  const mapId = <T extends { id: string }>(record: T) => {
    const { id: _id, ...fields } = record;
    return { _id, ...fields };
  };
  return { users: parsed.users.map(mapId), products: parsed.products.map(mapId), orders: parsed.orders.map(mapId), orderItems: parsed.orderItems.map(mapId) };
}

export async function importLegacyDocuments(client: MongoClient, db: Db, documents: LegacyDocuments): Promise<void> {
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      for (const name of Object.keys(documents)) {
        if (await db.collection(name).findOne({}, { session, projection: { _id: 1 } })) throw new Error('Import destination must be empty');
        const metadata = await db.listCollections({ name }, { nameOnly: false }).next();
        if (!metadata || !('options' in metadata) || !metadata.options?.validator) throw new Error('Run db:setup before importing');
      }
      for (const [name, records] of Object.entries(documents)) {
        for (let offset = 0; offset < records.length; offset += 500) {
          await db.collection(name).insertMany(records.slice(offset, offset + 500), { session });
        }
      }
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } finally { await session.endSession(); }
}
