const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const { MongoClient } = require('mongodb');
const { moneyToDecimal } = require('../dist/infrastructure/mongodb/money');
const { validateEnvironment } = require('../dist/config/environment');
const { collectionSchemas } = require('../dist/infrastructure/mongodb/schema');

async function main() {
  const name = process.argv[2];
  assert.match(name ?? '', /^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a catalog filename without its extension');
  const stockArgument = process.argv.slice(3).find(argument => argument.startsWith('--stock='));
  const stockText = stockArgument?.slice('--stock='.length);
  if (stockText !== undefined) assert.match(stockText, /^\d+$/, 'Stock must be a nonnegative integer');
  const confirmedStock = stockText === undefined ? undefined : Number(stockText);
  if (confirmedStock !== undefined) assert.ok(Number.isSafeInteger(confirmedStock) && confirmedStock <= 2147483647);
  const content = JSON.parse(readFileSync(path.join(__dirname, '../catalog', `${name}.json`), 'utf8'));
  for (const image of content.images ?? []) {
    assert.ok(image.startsWith('/images/products/'));
    assert.ok(existsSync(path.resolve(__dirname, '../../Frontend/public', '.' + image)), 'Local product image must exist');
  }
  const env = validateEnvironment(process.env);
  const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const products = client.db(env.MONGODB_DATABASE).collection('products');
    await client.db(env.MONGODB_DATABASE).command({ collMod: 'products', validator: collectionSchemas.products, validationLevel: 'strict', validationAction: 'error' });
    const existing = await products.findOne({ sku: content.sku });
    const now = new Date();
    await products.updateOne({ sku: content.sku }, {
      $set: { ...content, price: moneyToDecimal(content.price), regularPrice: moneyToDecimal(content.regularPrice), updatedAt: now, ...(confirmedStock !== undefined ? { stock: confirmedStock } : {}) },
      ...(confirmedStock !== undefined ? { $unset: { availability: '' } } : {}),
      $setOnInsert: { _id: randomUUID(), active: true, createdAt: now, ...(confirmedStock === undefined ? { stock: 0, availability: 'on-request' } : {}) },
    }, { upsert: true });
    const saved = await products.findOne({ sku: content.sku });
    assert.ok(saved);
    assert.equal(saved.price.toString(), content.price);
    assert.equal(saved.regularPrice.toString(), content.regularPrice);
    assert.deepEqual(saved.images, content.images);
    if (confirmedStock !== undefined) assert.equal(saved.stock, confirmedStock);
    if (existing) assert.equal(saved._id, existing._id);
    console.log(JSON.stringify({ action: existing ? 'updated' : 'inserted', id: saved._id, sku: saved.sku, price: saved.price.toString(), regularPrice: saved.regularPrice.toString(), stock: saved.stock, category: saved.category, images: saved.images.length }));
    console.log('Catalog caches expire according to CACHE_TTL_SECONDS.');
  } finally { await client.close(); }
}
main().catch(error => { console.error(`Product import failed (${error.code ?? error.name ?? 'unknown'}). Check catalog data, configuration, and connectivity.`); process.exitCode = 1; });
