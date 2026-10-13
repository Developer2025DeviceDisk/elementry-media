import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth/password-forms';
export const metadata: Metadata = { title: 'Forgot password', robots: { index: false } };
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
