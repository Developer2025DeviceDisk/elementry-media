import type { Product } from '@/types/product';
import catalogContent from './catalog-content.json';

// Store-owned assets remain available while older APIs omit optional image metadata.
// Prefer images returned by the API; never replace its price, stock, or product identity.
const productImages: Readonly<Record<string, { images: readonly string[] }>> = catalogContent;

export function withProductImages(product: Product): Product {
  if (product.images?.length) return product;
  const images = Object.hasOwn(productImages, product.sku) ? productImages[product.sku] : undefined;
  return images ? { ...product, images: [...images.images] } : product;
}
