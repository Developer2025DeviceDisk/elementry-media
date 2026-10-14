import { Db, Decimal128, Document } from 'mongodb';
import { accountSchemas, setupAccountIndexes } from '../../modules/account/account.schema';

const uuid = { bsonType: 'string', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' };
const timestamp = { bsonType: 'date' };
const currency = { bsonType: 'string', pattern: '^[A-Z]{3}$' };
const money = { bsonType: 'decimal', minimum: Decimal128.fromString('0.00'), maximum: Decimal128.fromString('9999999999.99') };
const integer = (minimum: number) => ({ bsonType: ['int', 'long', 'double'], minimum, maximum: 2147483647, multipleOf: 1 });
const text = (maxLength: number) => ({ bsonType: 'string', minLength: 1, maxLength });
const times = { createdAt: timestamp, updatedAt: timestamp };

export const collectionSchemas: Record<string, Document> = {
  users: { $jsonSchema: {
    bsonType: 'object', additionalProperties: false,
    required: ['_id', 'email', 'passwordHash', 'name', 'role', 'disabledAt', 'createdAt', 'updatedAt'],
    properties: { _id: uuid, email: { ...text(254), pattern: '^[^A-Z\\s]+@[^A-Z\\s]+$' }, passwordHash: text(1024), name: text(100), role: { enum: ['CUSTOMER', 'ADMIN'] }, disabledAt: { bsonType: ['date', 'null'] }, sessionVersion: integer(0), ...times },
  } },
  products: { $and: [{ $jsonSchema: {
    bsonType: 'object', additionalProperties: false,
    required: ['_id', 'sku', 'name', 'description', 'price', 'currency', 'stock', 'active', 'createdAt', 'updatedAt'],
    properties: { _id: uuid, sku: text(64), name: text(200), brand: text(100), description: { bsonType: ['string', 'null'] }, price: money, currency, stock: integer(0), active: { bsonType: 'bool' }, ...times },
  } }, { $expr: { $eq: ['$price', { $round: ['$price', 2] }] } }] },
  orders: { $and: [{ $jsonSchema: {
    bsonType: 'object', additionalProperties: false,
    required: ['_id', 'userId', 'status', 'total', 'currency', 'idempotencyKey', 'createdAt', 'updatedAt'],
    properties: { _id: uuid, userId: uuid, status: { enum: ['PENDING', 'PAID', 'FULFILLED', 'CANCELLED'] }, total: money, currency, idempotencyKey: text(128), ...times },
  } }, { $expr: { $eq: ['$total', { $round: ['$total', 2] }] } }] },
  orderItems: { $and: [{ $jsonSchema: {
    bsonType: 'object', additionalProperties: false,
    required: ['_id', 'orderId', 'productId', 'quantity', 'unitPrice', 'sku', 'name'],
    properties: { _id: uuid, orderId: uuid, productId: uuid, quantity: integer(1), unitPrice: money, sku: text(64), name: text(200) },
  } }, { $expr: { $eq: ['$unitPrice', { $round: ['$unitPrice', 2] }] } }] },
  ...accountSchemas,
};

// Deployment step: application startup never modifies schema.
export async function setupMongoSchema(db: Db): Promise<void> {
  for (const [name, validator] of Object.entries(collectionSchemas)) {
    if (await db.listCollections({ name }, { nameOnly: true }).hasNext()) {
      await db.command({ collMod: name, validator, validationLevel: 'strict', validationAction: 'error' });
    } else {
      await db.createCollection(name, { validator, validationLevel: 'strict', validationAction: 'error' });
    }
  }
  await db.collection('users').createIndex({ email: 1 }, { unique: true, name: 'users_email_unique' });
  await db.collection('products').createIndexes([
    { key: { sku: 1 }, unique: true, name: 'products_sku_unique' },
    { key: { active: 1, createdAt: -1, _id: -1 }, name: 'products_catalog' },
  ]);
  await db.collection('orders').createIndexes([
    { key: { idempotencyKey: 1 }, unique: true, name: 'orders_idempotency_unique' },
    { key: { userId: 1, createdAt: -1 }, name: 'orders_user_history' },
    { key: { status: 1, createdAt: -1 }, name: 'orders_status' },
  ]);
  await db.collection('orderItems').createIndexes([
    { key: { orderId: 1, productId: 1 }, unique: true, name: 'order_items_order_product_unique' },
    { key: { productId: 1 }, name: 'order_items_product' },
  ]);
  await setupAccountIndexes(db);
}
