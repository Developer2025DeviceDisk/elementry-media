import { Suspense } from 'react';
import type { Metadata } from 'next';
import { RouteGuard } from '@/lib/auth/route-guard';
import { PaymentReturn } from '@/features/checkout/payment-return';
import { LoadingSpinner, FeatureUnavailable } from '@/components/common/states';
import { env } from '@/config/env';
export const metadata: Metadata = { title: 'Payment confirmation', robots: { index: false } };
export default function PaymentReturnPage() {
  return (
    <div className="container py-12">
      <RouteGuard>
        {env.commerce ? (
          <Suspense fallback={<LoadingSpinner />}>
            <PaymentReturn />
          </Suspense>
        ) : (
          <FeatureUnavailable title="Payments" />
        )}
      </RouteGuard>
    </div>
  );
}
