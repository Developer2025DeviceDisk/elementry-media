import Link from 'next/link';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getCatalog } from '@/lib/api/catalog.server';
import { ProductGrid } from '@/components/product/product-grid';
import { ErrorState } from '@/components/common/states';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { Button } from '@/components/ui/button';
import { env } from '@/config/env';
interface Props {
  searchParams: Promise<{ page?: string; q?: string }>;
}
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page, q } = await searchParams;
  const current = Math.min(1000, Math.max(1, Math.floor(Number(page) || 1)));
  return {
    title: q ? 'Search products' : 'Products',
    ...(q ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: current === 1 ? '/products' : `/products?page=${current}` },
  };
}
export default async function ProductsPage({ searchParams }: Props) {
  await connection();
  const params = await searchParams;
  const page = Math.min(1000, Math.max(1, Math.floor(Number(params.page) || 1)));
  const q = params.q?.trim().slice(0, 100) ?? '';
  const pageHref = (nextPage: number) =>
    `/products?${new URLSearchParams({ page: String(nextPage), ...(q ? { q } : {}) })}`;
  const result = await getCatalog(page, 12, undefined, q)
    .then((data) => ({ data, error: undefined }))
    .catch((error: unknown) => ({ data: undefined, error }));
  return (
    <div className="container py-10">
      <Breadcrumbs items={[{ label: 'Products' }]} />
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-bold tracking-widest text-primary uppercase">
            Professional Equipment
          </p>
          <h1 className="text-4xl font-bold">{q ? 'Search results' : 'Our products'}</h1>
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
      <form role="search" action="/products" className="mb-8 flex max-w-xl gap-3">
        <input
          aria-label="Search products"
          type="search"
          name="q"
          defaultValue={q}
          maxLength={100}
          placeholder="Search by name, SKU, or description"
          className="min-w-0 flex-1 rounded-lg border px-4 py-2"
        />
        <Button>Search</Button>
        {q && (
          <Button asChild variant="outline">
            <Link href="/products">Clear</Link>
          </Button>
        )}
      </form>
      {result.data ? (
        <>
          <ProductGrid products={result.data.data} />
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
