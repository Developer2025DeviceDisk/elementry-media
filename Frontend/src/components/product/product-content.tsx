import { Check } from 'lucide-react';
import type { Product } from '@/types/product';

export function ProductContent({ product }: { product: Product }) {
  return (
    <div className="mt-12 space-y-12 border-t pt-10 sm:mt-16 sm:space-y-16 sm:pt-12">
      {product.description && (
        <section aria-labelledby="product-overview" className="max-w-3xl">
          <h2 id="product-overview" className="text-2xl font-bold">
            Product overview
          </h2>
          <p className="mt-4 leading-relaxed whitespace-pre-line text-muted-foreground">
            {product.description}
          </p>
        </section>
      )}
      {!!product.features?.length && (
        <section aria-labelledby="product-features">
          <h2 id="product-features" className="text-2xl font-bold">
            Key features
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {product.features.map((feature) => (
              <li key={feature} className="flex gap-3 rounded-xl border bg-surface p-5">
                <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {!!product.specifications?.length && (
        <section aria-labelledby="product-specifications">
          <h2 id="product-specifications" className="text-2xl font-bold">
            Technical highlights
          </h2>
          <dl className="mt-6 divide-y overflow-hidden rounded-2xl border">
            {product.specifications.map(({ label, value }) => (
              <div
                key={label}
                className="grid gap-2 px-5 py-4 odd:bg-surface sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-6 sm:px-6"
              >
                <dt className="font-semibold">{label}</dt>
                <dd className="min-w-0 leading-relaxed text-muted-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {!!product.useCases?.length && (
        <section aria-labelledby="product-use-cases">
          <h2 id="product-use-cases" className="text-2xl font-bold">
            Built for your workflow
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {product.useCases.map(({ title, description }) => (
              <div key={title} className="rounded-2xl border p-6">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {!!product.accessories?.length && (
        <section
          aria-labelledby="product-accessories"
          className="rounded-2xl bg-surface p-6 sm:p-8"
        >
          <h2 id="product-accessories" className="text-2xl font-bold">
            What’s in the box
          </h2>
          <ul className="mt-5 list-inside list-disc space-y-2 text-muted-foreground">
            {product.accessories.map((accessory) => (
              <li key={accessory}>{accessory}</li>
            ))}
          </ul>
          {product.manufacturerUrl?.startsWith('https://') && (
            <p className="mt-5 text-sm text-muted-foreground">
              Listed by the{' '}
              <a
                href={product.manufacturerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-4"
              >
                manufacturer<span className="sr-only"> (opens in a new tab)</span>
              </a>
              . Confirm the supplied package with our team before ordering.
            </p>
          )}
        </section>
      )}
      {!!product.faqs?.length && (
        <section aria-labelledby="product-faqs" className="max-w-4xl">
          <h2 id="product-faqs" className="text-2xl font-bold">
            Frequently asked questions
          </h2>
          <div className="mt-6 divide-y rounded-2xl border px-5 sm:px-6">
            {product.faqs.map(({ question, answer }) => (
              <details key={question} className="group py-5">
                <summary className="cursor-pointer pr-3 font-semibold marker:text-primary">
                  {question}
                </summary>
                <p className="mt-4 leading-relaxed text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
