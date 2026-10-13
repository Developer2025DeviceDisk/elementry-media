import { randomUUID } from 'node:crypto';
import { mapLegacyExport } from './legacy-import';

describe('Legacy data validation', () => {
  const timestamp = '2026-10-13T00:00:00+00:00';
  const user = { id: randomUUID(), email: 'user@example.com', passwordHash: 'preserved-scrypt-hash', name: 'User', role: 'CUSTOMER', disabledAt: null, createdAt: timestamp, updatedAt: timestamp };
  const product = { id: randomUUID(), sku: 'SKU', name: 'Camera', description: null, price: '9999999999.99', currency: 'INR', stock: 1, active: true, createdAt: timestamp, updatedAt: timestamp };
  const exported = { users: [user], products: [product], orders: [], orderItems: [] };
  it('preserves IDs, credentials, exact money and PostgreSQL timestamp offsets', () => {
    const mapped = mapLegacyExport(exported);
    expect(mapped.users[0]).toMatchObject({ _id: user.id, passwordHash: user.passwordHash, createdAt: new Date(timestamp) });
    expect(mapped.products[0].price.toString()).toBe('9999999999.99');
  });
  it('rejects malformed or extra fields without exposing exported values', () => {
    expect(() => mapLegacyExport({ ...exported, users: [{ ...user, secret: 'never-log-this' }] })).toThrow('Export validation failed');
    expect(() => mapLegacyExport({ ...exported, products: [{ ...product, price: 19.99 }] })).toThrow('Export validation failed');
  });
  it('detects duplicates after email normalization', () => {
    expect(() => mapLegacyExport({ ...exported, users: [user, { ...user, id: randomUUID(), email: user.email.toUpperCase() }] })).toThrow('duplicate');
  });
  it('rejects incomplete order references', () => {
    expect(() => mapLegacyExport({ ...exported, orders: [{ id: randomUUID(), userId: randomUUID(), status: 'PENDING', total: '19.90', currency: 'INR', idempotencyKey: 'key', createdAt: timestamp, updatedAt: timestamp }] })).toThrow('missing');
  });
});
