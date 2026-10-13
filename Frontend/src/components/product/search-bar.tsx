'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { env } from '@/config/env';
import { useDebounce } from '@/hooks/use-debounce';
import { useGetSearchSuggestionsQuery } from '@/store/api/productApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export function SearchSuggestions({ query }: { query: string }) {
  const debounced = useDebounce(query.trim());
  const { data } = useGetSearchSuggestionsQuery(debounced, {
    skip: !env.search || debounced.length < 2,
  });
  return data?.length ? (
    <ul
      aria-label="Search suggestions"
      className="absolute top-full right-0 left-0 z-20 mt-2 rounded-lg border bg-background p-2 shadow-lg"
    >
      {data.map((item) => (
        <li key={item.slug}>
          <Link
            className="block rounded px-3 py-2 text-sm hover:bg-muted"
            href={`/products/${item.slug}`}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  ) : null;
}
export function SearchBar({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        if (env.search) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }}
      className="relative flex gap-2"
    >
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>
      <Input
        id="product-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search the collection…"
        autoComplete="off"
        disabled={!env.search}
      />
      <Button aria-label="Search products" disabled={!env.search}>
        <Search className="size-4" />
      </Button>
      <SearchSuggestions query={query} />
    </form>
  );
}
