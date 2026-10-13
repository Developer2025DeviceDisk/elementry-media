import type { PageParams } from './common';
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  stock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  slug?: string;
  images?: string[];
  brand?: string;
  categoryId?: string;
  rating?: number;
  variants?: ProductVariant[];
}
export interface ProductVariant {
  id: string;
  name: string;
  stock: number;
}
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}
export interface ProductQuery extends PageParams {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'rating';
}
export interface SearchSuggestion {
  label: string;
  slug: string;
}
export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  comment: string;
}
export interface ProductInput {
  name: string;
  sku: string;
  description: string;
  price: string;
  currency: string;
  stock: number;
  active: boolean;
}
