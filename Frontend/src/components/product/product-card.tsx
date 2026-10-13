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
    <article className="group rounded-[14px] border bg-background p-6 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <Link href={`/products/${productSlug(product)}`} className="block">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-6"
            />
          ) : (
            <Package aria-hidden="true" className="size-16 text-primary/30" />
          )}
          {product.stock <= 0 && (
            <span className="absolute top-3 left-3 rounded-full bg-background px-3 py-1 text-xs">
              Out of stock
            </span>
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{product.name}</h3>
          {product.rating !== undefined && <Rating value={product.rating} />}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{product.brand ?? product.sku}</p>
        <p className="mt-3 font-semibold">
          <PriceDisplay price={product.price} currency={product.currency} />
        </p>
        <p
          className={`mt-2 text-xs ${product.stock > 0 ? 'text-green-700' : 'text-muted-foreground'}`}
        >
          {product.stock > 0 ? '● In stock' : 'Out of stock'}
        </p>
        <span className="mt-5 flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold group-hover:border-primary group-hover:text-primary">
          View Details <ArrowRight aria-hidden="true" className="size-4" />
        </span>
      </Link>
    </article>
  );
}
