import { Decimal128 } from 'mongodb';

// UUIDs remain stable so existing API URLs and exported records keep their IDs.
export enum Role { CUSTOMER = 'CUSTOMER', ADMIN = 'ADMIN' }
export enum OrderStatus { PENDING = 'PENDING', PAID = 'PAID', FULFILLED = 'FULFILLED', CANCELLED = 'CANCELLED' }
export interface UserDocument {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  disabledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sessionVersion?: number;
}
export interface ProductDocument {
  _id: string;
  sku: string;
  name: string;
  description: string | null;
  price: Decimal128;
  currency: string;
  stock: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface OrderDocument {
  _id: string;
  userId: string;
  status: OrderStatus;
  total: Decimal128;
  currency: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface OrderItemDocument {
  _id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: Decimal128;
  sku: string;
  name: string;
}
