'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Package } from 'lucide-react';
export function ProductGallery({ images = [], name }: { images?: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  // Product images are served locally; external hosts are not implicitly trusted.
  const safeImages = images.filter((src) => src.startsWith('/') && !src.startsWith('//'));
  return (
    <div className="min-w-0 self-start lg:sticky lg:top-28">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border bg-surface">
        {safeImages[selected] ? (
          <Image
            src={safeImages[selected]}
            alt={`${name} — image ${selected + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-8"
            loading="eager"
          />
        ) : (
          <Package aria-hidden="true" className="size-24 text-primary/25" />
        )}
      </div>
      {safeImages.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-3" aria-label="Product images">
          {safeImages.map((src, index) => (
            <button
              key={src}
              aria-label={`View image ${index + 1}`}
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
              className={`relative size-20 overflow-hidden rounded-xl border bg-surface focus-visible:outline-2 focus-visible:outline-primary ${index === selected ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
