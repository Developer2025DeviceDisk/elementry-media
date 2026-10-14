import { ProductsService } from './products.service';
import { MongoDbService } from '../../infrastructure/mongodb/mongodb.service';
import { CacheService } from '../../infrastructure/redis/cache.service';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../../config/environment';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProductQuery } from './products.dto';
import { Decimal128 } from 'mongodb';

describe('catalog search', () => {
  const toArray = jest.fn().mockResolvedValue([]);
  const limit = jest.fn(() => ({ toArray }));
  const skip = jest.fn(() => ({ limit }));
  const sort = jest.fn(() => ({ skip }));
  const find = jest.fn(() => ({ sort }));
  const findOne = jest.fn();
  const remember = jest.fn((_key: string, _ttl: number, loader: () => Promise<unknown>) => loader());
  const service = new ProductsService(
    { products: { find, findOne } } as unknown as MongoDbService,
    { remember } as unknown as CacheService,
    { get: () => 60 } as unknown as ConfigService<Environment, true>,
  );
  beforeEach(() => jest.clearAllMocks());
  it('searches active products by name, SKU, and description with pagination', async () => {
    await service.list({ page: 2, limit: 12, q: '  Camera  ' });
    expect(find).toHaveBeenCalledWith({ active: true, $or: ['name', 'sku', 'description'].map(field => ({ [field]: { $regex: 'Camera', $options: 'i' } })) });
    expect(skip).toHaveBeenCalledWith(12);
    expect(limit).toHaveBeenCalledWith(12);
    expect(sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
  });
  it('isolates search cache entries from the unfiltered catalog', async () => {
    await service.list({ page: 1, limit: 12 });
    await service.list({ page: 1, limit: 12, q: 'Camera' });
    expect(remember.mock.calls[0][0]).not.toEqual(remember.mock.calls[1][0]);
  });
  it('rejects oversized queries and accepts supported search parameters', async () => {
    expect(await validate(plainToInstance(ProductQuery, { q: 'Camera', page: '1', limit: '12' }))).toHaveLength(0);
    expect(await validate(plainToInstance(ProductQuery, { q: 'x'.repeat(101) }))).not.toHaveLength(0);
    expect(await validate(plainToInstance(ProductQuery, { brand: 'x'.repeat(101) }))).not.toHaveLength(0);
    expect(await validate(plainToInstance(ProductQuery, { brand: ['Panasonic', 'Canon'] }))).not.toHaveLength(0);
  });
  it('combines brand and search with literal, exact case-insensitive brand matching', async () => {
    await service.list({ page: 1, limit: 12, brand: '  a.*(b)  ', q: 'Camera' });
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ active: true, brand: { $regex: '^a\\.\\*\\(b\\)$', $options: 'i' }, $or: expect.any(Array) }));
  });
  it('isolates brand filters in Redis cache keys and treats blank brands as unfiltered', async () => {
    for (const brand of [undefined, 'Panasonic', 'Canon', '  ']) await service.list({ page: 1, limit: 12, brand });
    expect(new Set(remember.mock.calls.slice(0, 3).map(call => call[0])).size).toBe(3);
    expect(remember.mock.calls[0][0]).toBe(remember.mock.calls[3][0]);
  });
  it('escapes regex characters in user search', async () => {
    await service.list({ page: 1, limit: 12, q: 'a.*(b)' });
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ $or: expect.arrayContaining([{ name: { $regex: 'a\\.\\*\\(b\\)', $options: 'i' } }]) }));
  });
  it('preserves API IDs, exact prices and timestamps without exposing BSON fields', async () => {
    const now = new Date('2026-10-13T00:00:00Z');
    findOne.mockResolvedValue({ _id: 'product-id', sku: 'SKU', name: 'Camera', description: null, price: Decimal128.fromString('9999999999.99'), currency: 'INR', stock: 1, active: true, createdAt: now, updatedAt: now });
    const product = await service.detail('product-id');
    expect(product).toMatchObject({ id: 'product-id', price: '9999999999.99', createdAt: now.toISOString() });
    expect(product).not.toHaveProperty('_id');
    findOne.mockResolvedValue(null);
    await expect(service.detail('missing')).rejects.toThrow('Product not found');
  });
});
