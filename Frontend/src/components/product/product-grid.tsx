import type { Product } from '@/types/product';
import { ProductCard } from './product-card';
import { EmptyState } from '@/components/common/states';
export function ProductGrid({ products }: { products: Product[] }) {
  return products.length ? (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard product={product} key={product.id} />
      ))}
    </div>
  ) : (
    <EmptyState
      title="No products found"
      description="Check back soon or try a different search."
    />
  );
}
