'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useVerifyPaymentMutation } from '@/store/api/paymentApi';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/common/states';
import { useAppDispatch } from '@/store/hooks';
import { resetCheckout } from '@/store/slices/checkoutSlice';
export function PaymentReturn() {
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const [verify, { data, isLoading, error }] = useVerifyPaymentMutation();
  const orderId = params.get('orderId');
  const paymentId = params.get('paymentId');
  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-3xl font-bold">Payment confirmation</h1>
      {!orderId || !paymentId ? (
        <p role="alert">
          Payment details are missing. Check your order history for the latest status.
        </p>
      ) : data?.verified ? (
        <>
          <p role="status" className="mb-6">
            Payment verified. Your order is confirmed.
          </p>
          <Button asChild>
            <Link href={`/orders/${data.orderId}`}>View order</Link>
          </Button>
        </>
      ) : (
        <>
          <p className="mb-6">Confirm your payment status securely.</p>
          <Button
            disabled={isLoading}
            onClick={() => {
              void verify({ orderId, paymentId })
                .unwrap()
                .then((result) => {
                  if (result.verified) dispatch(resetCheckout());
                })
                .catch(() => undefined);
            }}
          >
            {isLoading ? 'Verifying…' : 'Verify payment'}
          </Button>
          {data && !data.verified && (
            <p role="status" className="mt-4">
              Payment is still pending. You can check again shortly.
            </p>
          )}
        </>
      )}
      {error && (
        <div className="mt-6">
          <ErrorState error={error} />
        </div>
      )}
    </div>
  );
}
