'use client';
import { useState } from 'react';
import type { Product } from '@/types/product';
import { ProductVariantSelector } from './product-variant-selector';
import { AddToCartButton } from './add-to-cart-button';
import { WishlistButton } from './wishlist-button';
import { Minus, Plus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { env } from '@/config/env';
import { money, productSlug } from '@/lib/utils';
export function ProductActions({ product }: { product: Product }) {
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const needsVariant = !!product.variants?.length;
  const selectedVariant = product.variants?.find((variant) => variant.id === variantId);
  const stock = selectedVariant ? Math.min(product.stock, selectedVariant.stock) : product.stock;
  const maxQuantity = product.availability === 'on-request' ? 99 : Math.max(1, Math.min(stock, 99));
  const selectedQuantity = Math.min(quantity, maxQuantity);
  const variantMissing = needsVariant && !variantId;
  const message = [
    `Hello, I would like to order ${product.name}.`,
    `SKU: ${product.sku}`,
    ...(selectedVariant ? [`Option: ${selectedVariant.name}`] : []),
    `Quantity: ${selectedQuantity}`,
    `Unit price: ${money(product.price, product.currency)}`,
    `Product: ${env.appUrl}/products/${productSlug(product)}`,
    'Please confirm availability, included accessories, and the final total.',
  ].join('\n');
  return (
    <div className="space-y-4">
      {needsVariant && (
        <ProductVariantSelector
          variants={product.variants ?? []}
          value={variantId}
          onChange={setVariantId}
        />
      )}
      <div className="space-y-2">
        <label htmlFor={`quantity-${product.id}`} className="text-sm font-semibold">
          Quantity
        </label>
        <div className="flex w-fit items-center rounded-xl border bg-background">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Decrease quantity"
            disabled={selectedQuantity <= 1}
            onClick={() => setQuantity(selectedQuantity - 1)}
          >
            <Minus aria-hidden="true" className="size-4" />
          </Button>
          <input
            id={`quantity-${product.id}`}
            aria-label="Quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={maxQuantity}
            step={1}
            value={selectedQuantity}
            onChange={(event) => {
              const next = Number(event.target.value);
              setQuantity(
                Number.isFinite(next) ? Math.max(1, Math.min(maxQuantity, Math.floor(next))) : 1,
              );
            }}
            className="h-11 w-16 bg-transparent text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Increase quantity"
            disabled={selectedQuantity >= maxQuantity}
            onClick={() => setQuantity(selectedQuantity + 1)}
          >
            <Plus aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <AddToCartButton
          productId={product.id}
          stock={stock}
          availability={product.availability}
          quantity={selectedQuantity}
          variantId={variantId || undefined}
          disabled={variantMissing}
        />
        <AddToCartButton
          productId={product.id}
          stock={stock}
          availability={product.availability}
          quantity={selectedQuantity}
          variantId={variantId || undefined}
          disabled={variantMissing}
          intent="checkout"
        />
      </div>
      {env.whatsappNumber && !variantMissing ? (
        <Button
          asChild
          variant="outline"
          className="w-full border-primary/40 text-primary hover:bg-accent"
        >
          <a
            href={`https://wa.me/${env.whatsappNumber}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Order on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Button>
      ) : (
        <Button variant="outline" className="w-full" disabled>
          <MessageCircle aria-hidden="true" className="size-4" />
          Order on WhatsApp
        </Button>
      )}
      {(!env.commerce || product.availability === 'on-request' || !env.whatsappNumber) && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {!env.commerce
            ? 'Online checkout is not available yet. '
            : product.availability === 'on-request'
              ? 'Please confirm availability before purchasing. '
              : ''}
          <a href="/#contact" className="font-medium text-primary underline underline-offset-4">
            Contact our team
          </a>{' '}
          for ordering assistance.
        </p>
      )}
      <WishlistButton productId={product.id} />
    </div>
  );
}
