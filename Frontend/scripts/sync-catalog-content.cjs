// Run locally when catalog content changes. The checked-in snapshot supports standalone frontend builds.
const { readFileSync, readdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const source = path.resolve(__dirname, '../../Backend/catalog');
const fields = [
  'regularPrice',
  'category',
  'images',
  'features',
  'specifications',
  'useCases',
  'faqs',
  'accessories',
  'manufacturerUrl',
];
const content = {};
for (const file of readdirSync(source)
  .filter((file) => file.endsWith('.json'))
  .sort()) {
  const product = JSON.parse(readFileSync(path.join(source, file), 'utf8'));
  if (Object.hasOwn(content, product.sku)) throw new Error('Duplicate catalog SKU');
  content[product.sku] = Object.fromEntries(
    fields.filter((field) => product[field] !== undefined).map((field) => [field, product[field]]),
  );
}
writeFileSync(
  path.resolve(__dirname, '../src/lib/constants/catalog-content.json'),
  JSON.stringify(content, null, 2) + '\n',
);
console.log(
  `Synced public display content for ${Object.keys(content).length} products. Live prices, stock, IDs, and availability are not copied.`,
);
