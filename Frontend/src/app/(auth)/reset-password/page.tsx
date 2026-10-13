import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/features/auth/password-forms';
import { LoadingSpinner } from '@/components/common/states';
export const metadata: Metadata = { title: 'Reset password', robots: { index: false } };
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
