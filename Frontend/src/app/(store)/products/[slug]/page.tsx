import type { Metadata } from 'next';
import { connection } from 'next/server';
import { notFound, permanentRedirect } from 'next/navigation';
import { env } from '@/config/env';
import { getProduct } from '@/lib/api/catalog.server';
import { productSlug, jsonLd } from '@/lib/utils';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ErrorState } from '@/components/common/states';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductDetails } from '@/components/product/product-details';
import { ReviewList } from '@/components/product/review-list';
interface Props {
  params: Promise<{ slug: string }>;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    return {
      title: product.name,
      description: product.description?.slice(0, 160),
      alternates: { canonical: `/products/${productSlug(product)}` },
      openGraph: {
        title: product.name,
        description: product.description?.slice(0, 160),
        url: `/products/${productSlug(product)}`,
      },
      twitter: { title: product.name, description: product.description?.slice(0, 160) },
    };
  } catch {
    return { title: 'Product unavailable', robots: { index: false } };
  }
}
export default async function ProductPage({ params }: Props) {
  await connection();
  const { slug } = await params;
  const result = await getProduct(slug)
    .then((product) => ({ product, error: undefined }))
    .catch((error: unknown) => ({ product: undefined, error }));
  if (!result.product) {
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
  const product = result.product;
  if (slug !== productSlug(product)) permanentRedirect(`/products/${productSlug(product)}`);
  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ label: 'Products', href: '/products' }, { label: product.name }]} />
      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />
        <ProductDetails product={product} />
      </div>
      <ReviewList productId={product.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            sku: product.sku,
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: product.currency,
              availability:
                product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              url: `${env.appUrl}/products/${productSlug(product)}`,
            },
          }),
        }}
      />
    </div>
  );
}
