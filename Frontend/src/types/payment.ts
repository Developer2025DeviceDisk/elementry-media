export interface PaymentSession {
  id: string;
  orderId: string;
  checkoutUrl: string;
}
export interface PaymentVerification {
  paymentId: string;
  orderId: string;
}
export interface PaymentStatus {
  verified: boolean;
  orderId: string;
}
