import type { Metadata } from 'next';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { getCatalog, getCategory } from '@/lib/api/catalog.server';
import { ProductGrid } from '@/components/product/product-grid';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ErrorState } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await getCategory(slug);
    return {
      title: category.name,
      description: category.description,
      alternates: { canonical: `/categories/${category.slug}` },
    };
  } catch {
    return { title: 'Category unavailable', robots: { index: false } };
  }
}
export default async function CategoryPage({ params, searchParams }: Props) {
  await connection();
  const { slug } = await params;
  const page = Math.min(1000, Math.max(1, Math.floor(Number((await searchParams).page) || 1)));
  const result = await (async () => {
    const category = await getCategory(slug);
    const products = await getCatalog(page, 12, slug);
    return { category, products };
  })()
    .then((data) => ({ data, error: undefined }))
    .catch((error: unknown) => ({ data: undefined, error }));
  if (!result.data) {
    if (
      result.error &&
      typeof result.error === 'object' &&
      'status' in result.error &&
      result.error.status === 404
    )
      notFound();
    return (
      <div className="container py-12">
        <ErrorState error={result.error} />
      </div>
    );
  }
  return (
    <div className="container py-10">
      <Breadcrumbs
        items={[{ label: 'Shop', href: '/products' }, { label: result.data.category.name }]}
      />
      <h1 className="text-3xl font-bold">{result.data.category.name}</h1>
      <p className="mt-3 mb-8 max-w-2xl leading-relaxed text-muted-foreground">
        {result.data.category.description}
      </p>
      <ProductGrid products={result.data.products.data} />
      <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4">
        {page > 1 && (
          <Button asChild variant="outline">
            <Link href={`/categories/${encodeURIComponent(slug)}?page=${page - 1}`}>Previous</Link>
          </Button>
        )}
        <span aria-current="page">Page {page}</span>
        {result.data.products.data.length === 12 && page < 1000 && (
          <Button asChild variant="outline">
            <Link href={`/categories/${encodeURIComponent(slug)}?page=${page + 1}`}>Next</Link>
          </Button>
        )}
      </nav>
    </div>
  );
}
