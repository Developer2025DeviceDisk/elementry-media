import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Filter } from 'mongodb';
import { Environment } from '../../config/environment';
import { MongoDbService } from '../../infrastructure/mongodb/mongodb.service';
import { ProductDocument } from '../../infrastructure/mongodb/models';
import { serializeMoney } from '../../infrastructure/mongodb/money';
import { CacheService } from '../../infrastructure/redis/cache.service';
import { ProductQuery } from './products.dto';

function serializeProduct(p: ProductDocument) {
  return { id: p._id, sku: p.sku, name: p.name, ...(p.brand ? { brand: p.brand } : {}), description: p.description,
    price: serializeMoney(p.price), currency: p.currency, stock: p.stock, active: p.active,
    createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() };
}

@Injectable()
export class ProductsService {
  constructor(private readonly mongo: MongoDbService, private readonly cache: CacheService, private readonly config: ConfigService<Environment, true>) {}
  list(query: ProductQuery) {
    const q = query.q?.trim() || undefined;
    const brand = query.brand?.trim() || undefined;
    return this.cache.remember(`products:v2:${query.page}:${query.limit}:${encodeURIComponent(q ?? '')}:${encodeURIComponent(brand ?? '')}`, this.config.get('CACHE_TTL_SECONDS', { infer: true }), async () => {
      // Treat search as a literal substring, not a user-controlled regex.
      const escaped = q?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedBrand = brand?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const filter: Filter<ProductDocument> = { active: true, ...(escapedBrand ? { brand: { $regex: `^${escapedBrand}$`, $options: 'i' } } : {}), ...(escaped ? {
        $or: ['name', 'sku', 'description'].map(field => ({ [field]: { $regex: escaped, $options: 'i' } })),
      } : {}) };
      const products = await this.mongo.products.find(filter).sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * query.limit).limit(query.limit).toArray();
      return {
        data: products.map(serializeProduct),
        page: query.page, limit: query.limit,
      };
    });
  }
  async detail(id: string) {
    return this.cache.remember(`product:v2:${id}`, this.config.get('CACHE_TTL_SECONDS', { infer: true }), async () => {
      const product = await this.mongo.products.findOne({ _id: id, active: true });
      if (!product) throw new NotFoundException('Product not found');
      return serializeProduct(product);
    });
  }
}
