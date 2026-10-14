import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
const product = JSON.parse(readFileSync(new URL('./product.json', import.meta.url), 'utf8'));
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
    const matches = [product.name, product.sku, product.description ?? ''].some((value) =>
      value.toLowerCase().includes(q),
    );
    response.end(
      JSON.stringify({
        data: matches && (!brand || product.brand.toLowerCase() === brand) ? [product] : [],
        page: Number(url.searchParams.get('page') ?? 1),
        limit: Number(url.searchParams.get('limit') ?? 12),
      }),
    );
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
