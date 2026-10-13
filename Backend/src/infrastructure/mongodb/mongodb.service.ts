import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Db, MongoClient } from 'mongodb';
import { Environment } from '../../config/environment';
import { OrderDocument, OrderItemDocument, ProductDocument, UserDocument } from './models';
import { CustomerAccountDocument, OrderTrackingDocument, ReturnDocument } from '../../modules/account/account.models';

@Injectable()
export class MongoDbService implements OnModuleInit, OnModuleDestroy {
  readonly client: MongoClient;
  readonly db: Db;
  constructor(config: ConfigService<Environment, true>) {
    this.client = new MongoClient(config.get('MONGODB_URI', { infer: true }), {
      serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000, socketTimeoutMS: 10000,
      maxPoolSize: 20, minPoolSize: 0, maxIdleTimeMS: 60000,
      appName: 'elementry-commerce-api',
    });
    this.db = this.client.db(config.get('MONGODB_DATABASE', { infer: true }));
  }
  get users() { return this.db.collection<UserDocument>('users'); }
  get products() { return this.db.collection<ProductDocument>('products'); }
  get orders() { return this.db.collection<OrderDocument>('orders'); }
  get orderItems() { return this.db.collection<OrderItemDocument>('orderItems'); }
  get accounts() { return this.db.collection<CustomerAccountDocument>('customerAccounts'); }
  get tracking() { return this.db.collection<OrderTrackingDocument>('orderTracking'); }
  get returns() { return this.db.collection<ReturnDocument>('returns'); }
  async ping() { await this.db.command({ ping: 1 }); }
  async onModuleInit() {
    try {
      await this.client.connect();
      await this.ping();
      const collections = await this.db.listCollections().toArray();
      for (const name of ['users', 'products', 'orders', 'orderItems', 'customerAccounts', 'orderTracking', 'returns']) {
        const collection = collections.find(collection => collection.name === name);
        const options = collection && 'options' in collection ? collection.options : undefined;
        if (!options?.validator || options.validationLevel !== 'strict' || options.validationAction !== 'error') {
          throw new Error('MongoDB validators are not ready; run npm run db:setup');
        }
      }
      // Fail closed if the required uniqueness constraints have not been deployed.
      for (const [collection, key] of [[this.users, 'email'], [this.products, 'sku'], [this.orders, 'idempotencyKey'], [this.returns, 'orderId']] as const) {
        const indexes = await collection.listIndexes().toArray();
        if (!indexes.some(index => index.unique && index.key[key] === 1 && Object.keys(index.key).length === 1 && !index.partialFilterExpression && !index.sparse)) {
          throw new Error('MongoDB schema is not ready; run npm run db:setup');
        }
      }
      const itemIndexes = await this.orderItems.listIndexes().toArray();
      if (!itemIndexes.some(index => index.unique && index.key.orderId === 1 && index.key.productId === 1 && Object.keys(index.key).length === 2 && !index.partialFilterExpression && !index.sparse)) {
        throw new Error('MongoDB order item index is not ready; run npm run db:setup');
      }
    } catch {
      await this.client.close();
      throw new Error('MongoDB startup failed; verify connectivity and run npm run db:setup');
    }
  }
  async onModuleDestroy() { await this.client.close(); }
}
