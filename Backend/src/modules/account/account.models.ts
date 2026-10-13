import { Decimal128 } from 'mongodb';

export interface SavedAddress {
  id: string; label: string; name: string; phone: string; line1: string; line2: string;
  city: string; state: string; postalCode: string; country: string;
}
export interface SavedUpi { id: string; label: string; upiId: string }
export interface AccountPreferences { orderUpdates: boolean; marketingEmails: boolean }
export interface CustomerAccountDocument {
  _id: string; phone: string | null; addresses: SavedAddress[]; defaultAddressId: string | null;
  paymentMethods: SavedUpi[]; defaultPaymentMethodId: string | null;
  wishlistProductIds: string[]; preferences: AccountPreferences; createdAt: Date; updatedAt: Date;
}
export const trackingStatuses = ['PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const;
export type TrackingStatus = typeof trackingStatuses[number];
export interface TrackingEvent { id: string; status: TrackingStatus; note: string; occurredAt: Date }
export interface OrderTrackingDocument {
  _id: string; userId: string; status: TrackingStatus; carrier: string | null; trackingNumber: string | null;
  events: TrackingEvent[]; updatedAt: Date;
}
export const returnStatuses = ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUND_PENDING', 'REFUNDED'] as const;
export type ReturnStatus = typeof returnStatuses[number];
export interface ReturnDocument {
  _id: string; userId: string; orderId: string; reason: string; status: ReturnStatus;
  reviewNote: string | null; refundAmount: Decimal128 | null; refundReference: string | null; currency: string;
  createdAt: Date; updatedAt: Date;
}
