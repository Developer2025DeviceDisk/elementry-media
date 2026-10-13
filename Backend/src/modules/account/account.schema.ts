import { Db, Decimal128, Document } from 'mongodb';
import { returnStatuses, trackingStatuses } from './account.models';

const uuid = { bsonType: 'string', pattern: '^[0-9a-fA-F-]{36}$' };
const text = (maxLength: number, minLength = 1) => ({ bsonType: 'string', minLength, maxLength });
const nullableText = (maxLength: number) => ({ bsonType: ['string', 'null'], maxLength });
const nullableId = { bsonType: ['string', 'null'] };
const date = { bsonType: 'date' };
const addressProperties = { id: uuid, label: text(30), name: text(100), phone: text(20), line1: text(200), line2: text(200, 0), city: text(100), state: text(100), postalCode: text(12), country: { bsonType: 'string', pattern: '^[A-Z]{2}$' } };
export const accountSchemas: Record<string, Document> = {
  customerAccounts: { $jsonSchema: { bsonType: 'object', additionalProperties: false,
    required: ['_id', 'phone', 'addresses', 'defaultAddressId', 'paymentMethods', 'defaultPaymentMethodId', 'wishlistProductIds', 'preferences', 'createdAt', 'updatedAt'],
    properties: {
      _id: uuid, phone: nullableText(20), addresses: { bsonType: 'array', maxItems: 20, items: { bsonType: 'object', additionalProperties: false, required: Object.keys(addressProperties), properties: addressProperties } },
      defaultAddressId: nullableId, defaultPaymentMethodId: nullableId,
      paymentMethods: { bsonType: 'array', maxItems: 10, items: { bsonType: 'object', additionalProperties: false, required: ['id', 'label', 'upiId'], properties: { id: uuid, label: text(40), upiId: { bsonType: 'string', pattern: '^[a-z0-9][a-z0-9._-]{1,99}@[a-z][a-z0-9.-]{1,49}$' } } } },
      wishlistProductIds: { bsonType: 'array', uniqueItems: true, maxItems: 200, items: uuid },
      preferences: { bsonType: 'object', additionalProperties: false, required: ['orderUpdates', 'marketingEmails'], properties: { orderUpdates: { bsonType: 'bool' }, marketingEmails: { bsonType: 'bool' } } },
      createdAt: date, updatedAt: date,
    },
  } },
  orderTracking: { $jsonSchema: { bsonType: 'object', additionalProperties: false,
    required: ['_id', 'userId', 'status', 'carrier', 'trackingNumber', 'events', 'updatedAt'],
    properties: { _id: uuid, userId: uuid, status: { enum: trackingStatuses }, carrier: nullableText(100), trackingNumber: nullableText(100), updatedAt: date,
      events: { bsonType: 'array', maxItems: 100, items: { bsonType: 'object', additionalProperties: false, required: ['id', 'status', 'note', 'occurredAt'], properties: { id: uuid, status: { enum: trackingStatuses }, note: text(300), occurredAt: date } } },
    },
  } },
  returns: { $jsonSchema: { bsonType: 'object', additionalProperties: false,
    required: ['_id', 'userId', 'orderId', 'reason', 'status', 'reviewNote', 'refundAmount', 'refundReference', 'currency', 'createdAt', 'updatedAt'],
    properties: { _id: uuid, userId: uuid, orderId: uuid, reason: text(500, 5), status: { enum: returnStatuses }, reviewNote: nullableText(500), refundReference: nullableText(128),
      refundAmount: { bsonType: ['decimal', 'null'], minimum: Decimal128.fromString('0'), maximum: Decimal128.fromString('9999999999.99') }, currency: { bsonType: 'string', pattern: '^[A-Z]{3}$' }, createdAt: date, updatedAt: date,
    },
  } },
};
export async function setupAccountIndexes(db: Db) {
  await db.collection('returns').createIndexes([
    { key: { orderId: 1 }, unique: true, name: 'returns_order_unique' },
    { key: { userId: 1, createdAt: -1 }, name: 'returns_user_history' },
  ]);
  await db.collection('orderTracking').createIndex({ userId: 1, updatedAt: -1 }, { name: 'tracking_user' });
}
