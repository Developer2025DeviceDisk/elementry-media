import type { Product } from '@/types/product';
import Link from 'next/link';
import { brandCatalogHref, findBrand } from '@/lib/constants/brands';
import { PriceDisplay } from './price-display';
import { StockStatus } from './stock-status';
import { Rating } from './rating';
import { ProductActions } from './product-actions';
export function ProductDetails({ product }: { product: Product }) {
  const brand = findBrand(product.brand);
  return (
    <div className="flex flex-col justify-center py-4">
      <p className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        {product.brand ? (
          <Link
            href={brandCatalogHref(brand?.name ?? product.brand)}
            className="hover:text-primary"
          >
            {brand?.name ?? product.brand}
          </Link>
        ) : (
          'Elementry Media Technology'
        )}
      </p>
      <h1 className="text-3xl leading-tight font-bold md:text-4xl">{product.name}</h1>
      {product.rating !== undefined && (
        <div className="mt-4">
          <Rating value={product.rating} />
        </div>
      )}
      <div className="mt-6 text-2xl">
        <PriceDisplay price={product.price} currency={product.currency} />
      </div>
      <div className="mt-3">
        <StockStatus stock={product.stock} />
      </div>
      <p className="my-8 leading-relaxed whitespace-pre-line text-muted-foreground">
        {product.description ??
          'Contact our team for equipment specifications and configuration advice.'}
      </p>
      <ProductActions product={product} />
      <p className="mt-6 text-xs text-muted-foreground">SKU: {product.sku}</p>
      {brand && (
        <a
          href={brand.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-sm font-medium text-primary underline underline-offset-4"
        >
          Visit {brand.name} official website <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}
