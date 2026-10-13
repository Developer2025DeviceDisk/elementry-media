import type { Address, CartItem } from './cart';
export type OrderStatus = 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED';
export interface Order {
  id: string;
  status: OrderStatus;
  total: string;
  currency: string;
  createdAt: string;
  items: CartItem[];
}
export interface CreateOrder {
  address: Address;
  shippingMethod: string;
  idempotencyKey: string;
}
