'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { env } from '@/config/env';
import { useGetProductsQuery } from '@/store/api/productApi';
import type { ProductQuery } from '@/types/product';
import { SearchBar } from '@/components/product/search-bar';
import { FilterSidebar, SortDropdown } from '@/components/product/filter-sidebar';
import { ProductGrid } from '@/components/product/product-grid';
import { ErrorState, FeatureUnavailable, ProductSkeleton } from '@/components/common/states';
import { Pagination } from '@/components/common/pagination';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setFilterPanelOpen } from '@/store/slices/filterSlice';
import { Button } from '@/components/ui/button';
export function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const panelOpen = useAppSelector((state) => state.filterUi.panelOpen);
  const page = Math.min(1000, Math.max(1, Number(params.get('page')) || 1));
  const sort = params.get('sort');
  const optionalNumber = (key: string) => {
    const value = params.get(key);
    return value !== null && Number.isFinite(Number(value))
      ? Math.max(0, Number(value))
      : undefined;
  };
  const query: ProductQuery = {
    page,
    limit: 12,
    q: params.get('q') ?? '',
    category: params.get('category') ?? undefined,
    brand: params.get('brand') ?? undefined,
    minPrice: optionalNumber('minPrice'),
    maxPrice: optionalNumber('maxPrice'),
    rating: optionalNumber('rating'),
    sort: sort === 'price-asc' || sort === 'price-desc' || sort === 'rating' ? sort : 'newest',
  };
  const { data, isLoading, isFetching, error, refetch } = useGetProductsQuery(query, {
    skip: !env.search,
  });
  return (
    <div className="container py-10">
      <h1 className="mb-6 text-3xl font-bold">Find your next essential</h1>
      <div className="mb-8 max-w-2xl">
        <SearchBar initialQuery={query.q} />
      </div>
      {!env.search ? (
        <FeatureUnavailable title="Product search" />
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="outline"
              className="md:hidden"
              aria-expanded={panelOpen}
              aria-controls="filters"
              onClick={() => dispatch(setFilterPanelOpen(!panelOpen))}
            >
              Filters
            </Button>
            <SortDropdown />
          </div>
          <div className="grid gap-8 md:grid-cols-[240px_1fr]">
            <aside id="filters" className={panelOpen ? 'block' : 'hidden md:block'}>
              <FilterSidebar />
            </aside>
            <div aria-busy={isFetching}>
              {isLoading ? (
                <ProductSkeleton />
              ) : error ? (
                <ErrorState error={error} retry={refetch} />
              ) : (
                <ProductGrid products={data?.data ?? []} />
              )}
              <Pagination
                page={page}
                hasNext={(data?.data.length ?? 0) === 12}
                disabled={isFetching}
                onChange={(nextPage) => {
                  const next = new URLSearchParams(params);
                  next.set('page', String(nextPage));
                  router.push(`/search?${next}`);
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
