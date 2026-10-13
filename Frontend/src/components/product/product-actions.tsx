'use client';
import { useState } from 'react';
import type { Product } from '@/types/product';
import { ProductVariantSelector } from './product-variant-selector';
import { AddToCartButton } from './add-to-cart-button';
import { WishlistButton } from './wishlist-button';
export function ProductActions({ product }: { product: Product }) {
  const [variantId, setVariantId] = useState('');
  const needsVariant = !!product.variants?.length;
  return (
    <div className="space-y-4">
      {needsVariant && (
        <ProductVariantSelector
          variants={product.variants ?? []}
          value={variantId}
          onChange={setVariantId}
        />
      )}
      <AddToCartButton
        productId={product.id}
        stock={product.stock}
        variantId={variantId || undefined}
        disabled={needsVariant && !variantId}
      />
      <WishlistButton productId={product.id} />
    </div>
  );
}
