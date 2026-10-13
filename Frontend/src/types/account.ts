export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
}
export interface SavedAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
export type AddressInput = Omit<SavedAddress, 'id'>;
export interface SavedUpi {
  id: string;
  label: string;
  upiId: string;
}
export type UpiInput = Omit<SavedUpi, 'id'>;
export interface SavedCollection<T> {
  data: T[];
  defaultId: string | null;
}
export interface AccountPreferences {
  orderUpdates: boolean;
  marketingEmails: boolean;
}
export interface CustomerReturn {
  id: string;
  orderId: string;
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUND_PENDING' | 'REFUNDED';
  reviewNote: string | null;
  refundAmount: string | null;
  refundReference: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}
export interface CustomerOrder {
  id: string;
  status: 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED';
  total: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: string;
  }[];
  tracking: {
    status: string;
    carrier: string | null;
    trackingNumber: string | null;
    events: { id: string; status: string; note: string; occurredAt: string }[];
  } | null;
  returnRequest: CustomerReturn | null;
  canCancel: boolean;
  canReturn: boolean;
}
export interface CustomerDashboard {
  profile: CustomerProfile;
  counts: {
    orders: number;
    wishlist: number;
    addresses: number;
    paymentMethods: number;
    openReturns: number;
  };
  recentOrders: CustomerOrder[];
}
