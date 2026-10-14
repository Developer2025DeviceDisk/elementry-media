import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { brands, brandCatalogHref } from '@/lib/constants/brands';

export function BrandDirectory({ selectedBrand }: { selectedBrand?: string }) {
  return (
    <ul
      aria-label="Brands and product lines"
      className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6"
    >
      {brands.map((brand) => {
        const selected = selectedBrand?.toLowerCase() === brand.name.toLowerCase();
        return (
          <li
            key={brand.name}
            className={`flex flex-col justify-between overflow-hidden rounded-xl border bg-background shadow-xs transition hover:border-primary/50 hover:shadow-sm ${selected ? 'border-primary ring-1 ring-primary' : ''}`}
          >
            <Link
              href={brandCatalogHref(brand.name)}
              prefetch={false}
              aria-label={`Browse ${brand.name} products`}
              aria-current={selected ? 'page' : undefined}
              className="flex min-h-20 items-center px-4 py-4 text-sm font-semibold break-words hover:text-primary"
            >
              {brand.name}
            </Link>
            <a
              href={brand.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${brand.name} official website (opens in a new tab)`}
              className="flex min-h-11 items-center justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground hover:text-primary"
            >
              Official website <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
