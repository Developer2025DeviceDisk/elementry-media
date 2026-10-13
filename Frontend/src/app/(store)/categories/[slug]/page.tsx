import type { Metadata } from 'next';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { env } from '@/config/env';
import { getCatalog, getCategory } from '@/lib/api/catalog.server';
import { ProductGrid } from '@/components/product/product-grid';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ErrorState, FeatureUnavailable } from '@/components/common/states';
interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!env.search) return { title: 'Categories', robots: { index: false } };
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
  if (!env.search)
    return (
      <div className="container py-12">
        <FeatureUnavailable title="Categories" />
      </div>
    );
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
      <Breadcrumbs items={[{ label: result.data.category.name }]} />
      <h1 className="mb-8 text-3xl font-bold">{result.data.category.name}</h1>
      <ProductGrid products={result.data.products.data} />
    </div>
  );
}
