import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/login-form';
import { LoadingSpinner } from '@/components/common/states';
export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };
export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginForm />
    </Suspense>
  );
}
