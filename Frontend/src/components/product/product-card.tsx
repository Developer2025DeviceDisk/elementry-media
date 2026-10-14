import Image from 'next/image';
import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';
import type { Product } from '@/types/product';
import { productSlug } from '@/lib/utils';
import { PriceDisplay } from './price-display';
import { Rating } from './rating';
export function ProductCard({ product }: { product: Product }) {
  const image = product.images?.find((src) => src.startsWith('/') && !src.startsWith('//'));
  return (
    <article className="group overflow-hidden rounded-2xl border bg-background p-4 shadow-xs transition duration-200 hover:border-primary/35 hover:shadow-md sm:p-5">
      <Link href={`/products/${productSlug(product)}`} className="block rounded-xl">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-surface transition-colors group-hover:bg-accent/60">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-6"
            />
          ) : (
            <Package aria-hidden="true" className="size-16 stroke-[1.25] text-secondary/35" />
          )}
          {product.stock <= 0 && (
            <span className="absolute top-3 left-3 rounded-full bg-background px-3 py-1 text-xs">
              Out of stock
            </span>
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <h3 className="text-base leading-snug font-semibold group-hover:text-primary">
            {product.name}
          </h3>
          {product.rating !== undefined && <Rating value={product.rating} />}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{product.brand ?? product.sku}</p>
        <p className="mt-4 text-lg font-semibold tracking-tight text-secondary">
          <PriceDisplay price={product.price} currency={product.currency} />
        </p>
        <p
          className={`mt-2 text-xs ${product.stock > 0 ? 'text-success' : 'text-muted-foreground'}`}
        >
          {product.stock > 0 ? '● In stock' : 'Out of stock'}
        </p>
        <span className="mt-5 flex items-center justify-between gap-2 border-t pt-4 text-sm font-semibold text-primary">
          View Details <ArrowRight aria-hidden="true" className="size-4" />
        </span>
      </Link>
    </article>
  );
}
