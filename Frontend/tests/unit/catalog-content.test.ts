import { describe, expect, it } from 'vitest';
import type { Product } from '@/types/product';
import { withProductContent } from '@/lib/constants/product-content';
import { getLegacyCategory, rejectsCategoryFilter } from '@/lib/api/catalog-compat';

const decoder: Product = {
  id: 'decoder-id',
  sku: 'MINE-A320H',
  name: 'MiNE Media A320H 8K 5G Bonding Video Decoder',
  description: '8K decoder',
  price: '350000.00',
  currency: 'INR',
  stock: 19,
  active: true,
  createdAt: '2026-10-22T00:00:00Z',
  updatedAt: '2026-10-22T00:00:00Z',
};

describe('catalog compatibility', () => {
  it('fills CNDLive technical highlights without replacing live sale price or stock', () => {
    const product = { ...decoder, sku: 'CND-D1', name: 'CNDLive D1', price: '49000.00', stock: 9 };
    const result = withProductContent(product);
    expect(result).toMatchObject(product);
    expect(result.regularPrice).toBe('100000.00');
    expect(result.images).toHaveLength(4);
    expect(result.specifications).toHaveLength(11);
    expect(result.faqs).toHaveLength(10);
    expect(result.specifications).toContainEqual({
      label: 'Operating temperature',
      value: '-10°C to 45°C',
    });
  });
  it('restores published decoder content from a legacy response while preserving live stock, prices, and identity', () => {
    const result = withProductContent(decoder);
    expect(result).toMatchObject(decoder);
    expect(result).toMatchObject({
      regularPrice: '399999.00',
      category: 'show',
      images: [
        '/images/products/mine-a320h/decoder.png',
        '/images/products/mine-a320h/front-angle.jpg',
        '/images/products/mine-a320h/front.jpg',
        '/images/products/mine-a320h/rear.jpg',
      ],
    });
    expect(result.features).toHaveLength(10);
    expect(result.faqs).toHaveLength(10);
    expect(result.useCases).toHaveLength(5);
    expect(result).not.toHaveProperty('accessories');
    const apiProduct = {
      ...decoder,
      regularPrice: '401000.00',
      features: ['Updated feature'],
      images: ['/images/updated.png'],
    };
    expect(withProductContent(apiProduct)).toMatchObject(apiProduct);
  });
  it('recognizes only an unsupported-category validation error', () => {
    expect(
      rejectsCategoryFilter({
        status: 400,
        data: { message: ['property category should not exist'] },
      }),
    ).toBe(true);
    expect(rejectsCategoryFilter({ status: 400, data: { message: 'Invalid query' } })).toBe(false);
    expect(
      rejectsCategoryFilter({
        status: 500,
        data: { message: ['property category should not exist'] },
      }),
    ).toBe(false);
    expect(rejectsCategoryFilter({ status: 'FETCH_ERROR' })).toBe(false);
  });
  it('resolves Show through real SKU searches with pagination and never invents an absent product', async () => {
    const requests: string[] = [];
    const read = async (query: { q?: string }) => {
      requests.push(query.q!);
      return {
        data: query.q === 'MINE-A320H' ? [withProductContent(decoder)] : [],
        page: 1,
        limit: 100,
      };
    };
    const result = await getLegacyCategory({ category: 'show', page: 1, limit: 1 }, read);
    expect(result).toMatchObject({ page: 1, limit: 1, total: 1 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject(decoder);
    expect(requests).toEqual(['CND-D1', 'MINE-A320H', 'MINE-A5']);
    expect(
      (await getLegacyCategory({ category: 'show', page: 2, limit: 1 }, read)).data,
    ).toHaveLength(0);
    expect((await getLegacyCategory({ category: 'show', q: 'unrelated' }, read)).data).toHaveLength(
      0,
    );
    expect((await getLegacyCategory({ category: 'unknown' }, read)).data).toHaveLength(0);
  });
});
