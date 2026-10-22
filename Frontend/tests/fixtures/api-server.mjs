import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
const product = JSON.parse(readFileSync(new URL('./product.json', import.meta.url), 'utf8'));
const cameraContent = JSON.parse(
  readFileSync(new URL('../../../Backend/catalog/mine-a5.json', import.meta.url), 'utf8'),
);
const camera = {
  ...cameraContent,
  id: 'a5c34b17-4d83-4d4d-a8fe-cf86be01c906',
  stock: 10,
  active: true,
  createdAt: '2026-10-22T00:00:00Z',
  updatedAt: '2026-10-22T00:00:00Z',
};
const unconfirmedCamera = {
  ...camera,
  id: 'a5c34b17-4d83-4d4d-a8fe-cf86be01c907',
  stock: 0,
  availability: 'on-request',
};
const decoder = {
  ...JSON.parse(
    readFileSync(new URL('../../../Backend/catalog/mine-a320h.json', import.meta.url), 'utf8'),
  ),
  id: '320a0000-0000-4000-8000-000000000001',
  stock: 20,
  active: true,
  createdAt: '2026-10-22T01:00:00Z',
  updatedAt: '2026-10-22T01:00:00Z',
};
const cndDecoder = {
  ...JSON.parse(
    readFileSync(new URL('../../../Backend/catalog/cndlive-d1.json', import.meta.url), 'utf8'),
  ),
  id: 'd1000000-0000-4000-8000-000000000001',
  stock: 10,
  active: true,
  createdAt: '2026-10-22T02:00:00Z',
  updatedAt: '2026-10-22T02:00:00Z',
};
const port = Number(process.env.E2E_API_PORT ?? 4102);
const server = createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${port}`);
  response.setHeader('Content-Type', 'application/json');
  response.setHeader(
    'Access-Control-Allow-Origin',
    process.env.E2E_FRONTEND_ORIGIN ?? 'http://localhost:3102',
  );
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  if (url.pathname === '/api/v1/products') {
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const brand = (url.searchParams.get('brand') ?? '').trim().toLowerCase();
    const category = (url.searchParams.get('category') ?? '').trim().toLowerCase();
    const matches = [product, camera, decoder, cndDecoder].filter(
      (item) =>
        [item.name, item.sku, item.description ?? ''].some((value) =>
          value.toLowerCase().includes(q),
        ) &&
        (!brand || item.brand.toLowerCase() === brand) &&
        (!category || item.category === category),
    );
    response.end(
      JSON.stringify({
        data: matches,
        page: Number(url.searchParams.get('page') ?? 1),
        limit: Number(url.searchParams.get('limit') ?? 12),
      }),
    );
    return;
  }
  if (url.pathname === `/api/v1/products/${camera.id}`) {
    response.end(JSON.stringify(camera));
    return;
  }
  if (url.pathname === `/api/v1/products/${decoder.id}`) {
    response.end(JSON.stringify(decoder));
    return;
  }
  if (url.pathname === `/api/v1/products/${cndDecoder.id}`) {
    response.end(JSON.stringify(cndDecoder));
    return;
  }
  if (url.pathname === `/api/v1/products/${unconfirmedCamera.id}`) {
    response.end(JSON.stringify(unconfirmedCamera));
    return;
  }
  if (url.pathname === `/api/v1/products/${product.id}`) {
    response.end(JSON.stringify(product));
    return;
  }
  response.statusCode = 404;
  response.end(JSON.stringify({ message: 'Not found' }));
});
server.listen(port, 'localhost');
process.on('SIGTERM', () => server.close());
