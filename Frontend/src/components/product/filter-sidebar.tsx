'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export function PriceFilter() {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-sm font-semibold">Price range</legend>
      <label htmlFor="min-price" className="sr-only">
        Minimum price
      </label>
      <Input id="min-price" name="minPrice" type="number" min="0" placeholder="Minimum" />
      <label htmlFor="max-price" className="sr-only">
        Maximum price
      </label>
      <Input id="max-price" name="maxPrice" type="number" min="0" placeholder="Maximum" />
    </fieldset>
  );
}
export function CategoryFilter() {
  return (
    <div className="space-y-2">
      <label htmlFor="category-filter" className="text-sm font-semibold">
        Category
      </label>
      <Input id="category-filter" name="category" placeholder="Category slug" />
    </div>
  );
}
export function BrandFilter() {
  return (
    <div className="space-y-2">
      <label htmlFor="brand-filter" className="text-sm font-semibold">
        Brand
      </label>
      <Input id="brand-filter" name="brand" placeholder="Brand name" />
    </div>
  );
}
export function RatingFilter() {
  return (
    <div className="space-y-2">
      <label htmlFor="rating-filter" className="text-sm font-semibold">
        Minimum rating
      </label>
      <select id="rating-filter" name="rating" className="w-full">
        <option value="">All ratings</option>
        {[4, 3, 2, 1].map((value) => (
          <option key={value} value={value}>
            {value}+ stars
          </option>
        ))}
      </select>
    </div>
  );
}
export function SortDropdown() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="sort">Sort by</label>
      <select
        id="sort"
        value={params.get('sort') ?? 'newest'}
        onChange={(event) => {
          const next = new URLSearchParams(params);
          next.set('sort', event.target.value);
          next.delete('page');
          router.push(`${path}?${next}`);
        }}
      >
        <option value="newest">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="rating">Top rated</option>
      </select>
    </div>
  );
}
export function FilterSidebar() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  return (
    <form
      aria-label="Product filters"
      className="space-y-6 rounded-2xl border bg-surface p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const next = new URLSearchParams(params);
        ['minPrice', 'maxPrice', 'category', 'brand', 'rating'].forEach((key) => {
          const value = String(form.get(key) ?? '');
          if (value) next.set(key, value);
          else next.delete(key);
        });
        next.delete('page');
        router.push(`${path}?${next}`);
      }}
    >
      <h2 className="font-semibold">Filter collection</h2>
      <PriceFilter />
      <CategoryFilter />
      <BrandFilter />
      <RatingFilter />
      <Button className="w-full">Apply filters</Button>
      <Button
        className="w-full"
        variant="ghost"
        type="button"
        onClick={() =>
          router.push(
            `${path}?${new URLSearchParams(params.has('q') ? { q: params.get('q') ?? '' } : {})}`,
          )
        }
      >
        Clear filters
      </Button>
    </form>
  );
}
