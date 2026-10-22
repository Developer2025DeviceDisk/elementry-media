const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { MongoClient } = require('mongodb');
const { moneyToDecimal } = require('../dist/infrastructure/mongodb/money');
const { collectionSchemas } = require('../dist/infrastructure/mongodb/schema');
const { validateEnvironment } = require('../dist/config/environment');

async function main() {
  const env = validateEnvironment(process.env);
  const content = JSON.parse(readFileSync(path.join(__dirname, '../catalog/mine-a5.json'), 'utf8'));
  const stockArgument = process.argv.slice(2).find(argument => argument.startsWith('--stock='));
  const confirmedStock = stockArgument === undefined ? undefined : Number(stockArgument.slice('--stock='.length));
  if (confirmedStock !== undefined && (!Number.isSafeInteger(confirmedStock) || confirmedStock < 0 || confirmedStock > 2147483647)) throw new Error('Invalid confirmed stock');
  const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db(env.MONGODB_DATABASE);
    const products = db.collection('products');
    const existing = await products.findOne({ sku: content.sku });
    // Extend the products validator only; existing IDs and stock are preserved unless --stock is supplied.
    await db.command({ collMod: 'products', validator: collectionSchemas.products, validationLevel: 'strict', validationAction: 'error' });
    const now = new Date();
    await products.updateOne({ sku: content.sku }, {
      $set: { ...content, price: moneyToDecimal(content.price), regularPrice: moneyToDecimal(content.regularPrice), updatedAt: now, ...(confirmedStock !== undefined ? { stock: confirmedStock } : {}) },
      ...(confirmedStock !== undefined ? { $unset: { availability: '' } } : {}),
      $setOnInsert: { _id: randomUUID(), ...(confirmedStock === undefined ? { stock: 0, availability: 'on-request' } : {}), active: true, createdAt: now },
    }, { upsert: true });
    const saved = await products.findOne({ sku: content.sku });
    if (!saved || saved.price.toString() !== '69000.00' || saved.regularPrice.toString() !== '100000.00' || saved.category !== 'show') throw new Error('Catalog verification failed');
    console.log(JSON.stringify({ action: existing ? 'updated' : 'inserted', id: saved._id, sku: saved.sku, category: saved.category, price: saved.price.toString(), regularPrice: saved.regularPrice.toString(), stock: saved.stock, availability: saved.availability ?? (saved.stock > 0 ? 'in-stock' : 'out-of-stock') }));
    console.log(`Product URL: /products/mine-a5-4k-network-bonding-streaming-camera--${saved._id}`);
    console.log('Catalog caches expire according to CACHE_TTL_SECONDS; deploy the updated API and frontend to expose the new fields.');
  } finally { await client.close(); }
}
main().catch(error => {
  console.error(`Mine A5 import failed (${error.code ?? error.name ?? 'unknown'}). Check connectivity, schema permissions, and configuration.`);
  process.exitCode = 1;
});
