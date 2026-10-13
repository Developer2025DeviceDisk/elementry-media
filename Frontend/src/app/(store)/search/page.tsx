import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SearchResults } from '@/features/products/search-results';
import { LoadingSpinner } from '@/components/common/states';
export const metadata: Metadata = { title: 'Search', robots: { index: false, follow: true } };
export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SearchResults />
    </Suspense>
  );
}
