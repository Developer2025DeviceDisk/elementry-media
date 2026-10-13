'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Package } from 'lucide-react';
export function ProductGallery({ images = [], name }: { images?: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  // The backend currently has no image contract. Accept only same-origin assets until an approved image host is configured.
  const safeImages = images.filter((src) => src.startsWith('/') && !src.startsWith('//'));
  return (
    <div>
      <div className="relative flex aspect-square items-center justify-center rounded-2xl bg-muted">
        {safeImages[selected] ? (
          <Image
            src={safeImages[selected]}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-8"
            priority
          />
        ) : (
          <Package aria-hidden="true" className="size-24 text-primary/25" />
        )}
      </div>
      {safeImages.length > 1 && (
        <div className="mt-4 flex gap-3">
          {safeImages.map((src, index) => (
            <button
              key={src}
              aria-label={`View image ${index + 1}`}
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
              className="relative size-20 rounded border focus-visible:outline-2"
            >
              <Image src={src} alt="" fill sizes="80px" className="object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
