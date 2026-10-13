'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validations/auth';
import type { Credentials } from '@/types/auth';
import { useLoginMutation } from '@/store/api/authApi';
import { apiErrorMessage } from '@/lib/api/errors';
import { safeRedirect } from '@/lib/utils';
import { FormField } from '@/components/common/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [login, { isLoading, error }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Credentials>({ resolver: zodResolver(loginSchema) });
  async function submit(values: Credentials) {
    try {
      await login(values).unwrap();
      router.replace(safeRedirect(params.get('next')));
    } catch {
      /* Error rendered below. */
    }
  }
  return (
    <>
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="mt-3 mb-8 text-muted-foreground">Sign in to your Elementry Media account.</p>
      <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
        <FormField id="email" label="Email address" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
        </FormField>
        <FormField id="password" label="Password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
        </FormField>
        <Link href="/forgot-password" className="block text-sm text-primary">
          Forgot password?
        </Link>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {apiErrorMessage(error)}
          </p>
        )}
        <Button className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Elementry Media?{' '}
        <Link href="/register" className="font-semibold text-primary">
          Create an account
        </Link>
      </p>
    </>
  );
}
