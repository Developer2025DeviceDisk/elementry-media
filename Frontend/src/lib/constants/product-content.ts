import type { Product } from '@/types/product';
import snapshot from './catalog-content.json';
import { withProductImages } from './product-images';

type DisplayContent = Pick<
  Product,
  | 'regularPrice'
  | 'category'
  | 'images'
  | 'features'
  | 'specifications'
  | 'useCases'
  | 'faqs'
  | 'accessories'
  | 'manufacturerUrl'
>;
const catalogContent: Readonly<Record<string, DisplayContent>> = snapshot;

export function withProductContent(product: Product): Product {
  if (!Object.hasOwn(catalogContent, product.sku)) return product;
  const content = catalogContent[product.sku];
  const missing = Object.fromEntries(
    Object.entries(content).filter(
      ([field]) => product[field as keyof Product] === undefined && field !== 'images',
    ),
  );
  return withProductImages({ ...product, ...missing });
}

export function categoryProductSkus(category: string): string[] {
  return Object.entries(catalogContent)
    .filter(([, content]) => content.category === category)
    .map(([sku]) => sku);
}
