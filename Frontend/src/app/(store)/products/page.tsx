import Link from 'next/link';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getCatalog } from '@/lib/api/catalog.server';
import { ProductGrid } from '@/components/product/product-grid';
import { ErrorState } from '@/components/common/states';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { Button } from '@/components/ui/button';
import { env } from '@/config/env';
import { BrandDirectory } from '@/components/product/brand-directory';
import { brands, findBrand } from '@/lib/constants/brands';
import { shopCategories } from '@/lib/constants/categories';
interface Props {
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
    brand?: string | string[];
    category?: string | string[];
  }>;
}
const firstValue = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value) ?? '';
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const current = Math.min(1000, Math.max(1, Math.floor(Number(firstValue(params.page)) || 1)));
  const q = firstValue(params.q).trim();
  const brand = firstValue(params.brand).trim().slice(0, 100);
  const category = firstValue(params.category).trim().toLowerCase().slice(0, 100);
  return {
    title: brand
      ? `${findBrand(brand)?.name ?? brand} products`
      : q
        ? 'Search products'
        : category === 'show'
          ? 'Show equipment | Shop'
          : 'Shop',
    ...(q || brand || category ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: current === 1 ? '/products' : `/products?page=${current}` },
  };
}
export default async function ProductsPage({ searchParams }: Props) {
  await connection();
  const params = await searchParams;
  const page = Math.min(1000, Math.max(1, Math.floor(Number(firstValue(params.page)) || 1)));
  const q = firstValue(params.q).trim().slice(0, 100);
  const requestedBrand = firstValue(params.brand).trim().slice(0, 100);
  const knownBrand = findBrand(requestedBrand);
  const brand = knownBrand?.name ?? requestedBrand;
  const category = firstValue(params.category).trim().toLowerCase().slice(0, 100);
  const pageHref = (nextPage: number) =>
    `/products?${new URLSearchParams({ page: String(nextPage), ...(q ? { q } : {}), ...(brand ? { brand } : {}), ...(category ? { category } : {}) })}`;
  const result = await getCatalog(page, 12, category || undefined, q, brand)
    .then((data) => ({ data, error: undefined }))
    .catch((error: unknown) => ({ data: undefined, error }));
  return (
    <div className="container py-10 sm:py-14">
      <Breadcrumbs items={[{ label: 'Shop' }]} />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 rounded-2xl border bg-surface p-6 sm:p-8">
        <div>
          <p className="mb-3 text-xs font-bold tracking-widest text-primary uppercase">
            Professional Equipment
          </p>
          <h1 className="text-4xl font-bold">
            {brand
              ? `${brand} products`
              : q
                ? 'Search results'
                : category === 'show'
                  ? 'Show equipment'
                  : 'Shop'}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {q
              ? `Showing results for “${q}”`
              : 'Discover equipment for broadcast, studios, education, and enterprise workflows.'}
          </p>
        </div>
        {env.search && (
          <Link href="/search" className="text-sm font-medium">
            Search & filter
          </Link>
        )}
      </div>
      <nav aria-label="Shop categories" className="mb-6 flex flex-wrap gap-3">
        <Button asChild variant={!category ? 'default' : 'outline'}>
          <Link href="/products" aria-current={!category ? 'page' : undefined}>
            All products
          </Link>
        </Button>
        {shopCategories.map((item) => (
          <Button asChild key={item.slug} variant={category === item.slug ? 'default' : 'outline'}>
            <Link href={`/categories/${item.slug}`}>{item.name}</Link>
          </Button>
        ))}
      </nav>
      <form
        key={JSON.stringify([q, brand, category])}
        role="search"
        action="/products"
        className="mb-6 flex flex-col gap-3 rounded-2xl border bg-background p-5 shadow-xs sm:flex-row sm:flex-wrap sm:items-end"
      >
        {category && <input type="hidden" name="category" value={category} />}
        <label className="flex min-w-0 flex-col gap-2 text-sm font-medium sm:min-w-64 sm:flex-1">
          Search products
          <input
            aria-label="Search products"
            type="search"
            name="q"
            defaultValue={q}
            maxLength={100}
            placeholder="Search by name, SKU, or description"
            className="min-h-11 min-w-0 rounded-xl border bg-surface px-4 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium sm:w-64">
          Filter by brand
          <select
            name="brand"
            defaultValue={brand}
            className="min-h-11 max-w-full rounded-lg border bg-background px-3 py-2"
          >
            <option value="">All brands</option>
            {brand && !knownBrand && <option value={brand}>{brand}</option>}
            {brands.map(({ name }) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <Button className="min-h-11">Search</Button>
        {(q || brand) && (
          <Button asChild variant="outline">
            <Link href="/products">Clear</Link>
          </Button>
        )}
      </form>
      <details className="mb-8 rounded-xl border bg-surface p-4 sm:p-5">
        <summary className="cursor-pointer text-sm font-semibold">
          Browse all {brands.length} brands &amp; product lines
        </summary>
        <p className="mt-4 mb-5 text-sm text-muted-foreground">
          Choose a brand to see its listed products. Use the official website links for manufacturer
          information.
        </p>
        <BrandDirectory selectedBrand={brand} />
      </details>
      {result.data ? (
        <>
          <ProductGrid products={result.data.data} />
          {result.data.data.length === 0 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Looking for equipment from {brand || 'these brands'}?{' '}
              <Link
                href="/#contact"
                className="font-medium text-primary underline underline-offset-4"
              >
                Contact our team
              </Link>{' '}
              for availability and product guidance.
            </p>
          )}
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4">
            {page > 1 && (
              <Button asChild variant="outline">
                <Link href={pageHref(page - 1)}>Previous</Link>
              </Button>
            )}
            <span aria-current="page">Page {page}</span>
            {result.data.data.length === 12 && page < 1000 && (
              <Button asChild variant="outline">
                <Link href={pageHref(page + 1)}>Next</Link>
              </Button>
            )}
          </nav>
        </>
      ) : (
        <ErrorState error={result.error} />
      )}
    </div>
  );
}
