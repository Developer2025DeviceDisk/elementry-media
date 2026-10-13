import type { Product } from './product';
export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  variantId?: string;
}
export interface Cart {
  id: string;
  items: CartItem[];
  currency: string;
  subtotal: string;
  discount: string;
  tax: string;
  shipping: string;
  total: string;
}
export interface AddCartItem {
  productId: string;
  quantity: number;
  variantId?: string;
}
export interface Address {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}
