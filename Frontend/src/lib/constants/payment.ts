// Provider redirect allowlist. Add the selected provider's exact HTTPS hostname after backend integration.
export const paymentHosts = new Set(['checkout.stripe.com', 'api.razorpay.com']);
export function validatedPaymentUrl(value: string): string {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    !paymentHosts.has(url.hostname) ||
    url.username ||
    url.password ||
    url.port
  )
    throw new Error('Invalid payment destination');
  return url.href;
}
