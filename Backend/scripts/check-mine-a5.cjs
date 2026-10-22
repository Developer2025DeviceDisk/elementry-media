// Read-only catalog verification through the real HTTP API, MongoDB, and Redis.
require('reflect-metadata');
const assert = require('node:assert/strict');
const content = require('../catalog/mine-a5.json');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { configureApp } = require('../dist/bootstrap');

async function main() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false });
  try {
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    const origin = await app.getUrl();
    async function get(path) {
      const response = await fetch(`${origin}/api/v1/${path}`);
      assert.equal(response.status, 200);
      return response.json();
    }
    const list = await get('products?category=show&q=MINE-A5&limit=100');
    const product = list.data.find((item) => item.sku === 'MINE-A5');
    assert.ok(product, 'Requested camera must be in the Show category');
    assert.equal(product.category, 'show');
    assert.equal(product.price, '69000.00');
    assert.equal(product.regularPrice, '100000.00');
    const stockArgument = process.argv.slice(2).find(argument => argument.startsWith('--stock='));
    if (stockArgument !== undefined) {
      assert.equal(product.stock, Number(stockArgument.slice('--stock='.length)));
      assert.equal(product.availability, undefined);
    }
    const detail = await get(`products/${product.id}`);
    assert.deepEqual(detail, product);
    assert.deepEqual(detail.images, content.images);
    assert.equal(detail.faqs.length, 9);
    assert.equal(detail.features.length, 6);
    assert.equal(detail.accessories.length, 4);
    const otherCategory = await get('products?category=unrelated-category&q=MINE-A5');
    assert.equal(otherCategory.data.length, 0);
    const brand = await get('products?category=show&brand=MiNE%20Media&q=MINE-A5');
    assert.ok(brand.data.some((item) => item.id === product.id));
    console.log(JSON.stringify({ verified: true, id: product.id, category: product.category, price: product.price, regularPrice: product.regularPrice, stock: product.stock, images: detail.images.length, faqs: detail.faqs.length, availability: product.availability ?? 'confirmed-stock' }));
  } finally { await app.close(); }
}
main().catch(error => {
  console.error(`Mine A5 API verification failed (${error.code ?? error.name ?? 'unknown'}).`);
  process.exitCode = 1;
});
