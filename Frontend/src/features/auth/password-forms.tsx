'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { env } from '@/config/env';
import { forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/auth';
import { useForgotPasswordMutation, useResetPasswordMutation } from '@/store/api/authApi';
import { FeatureUnavailable } from '@/components/common/states';
import { FormField } from '@/components/common/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/lib/api/errors';
export function ForgotPasswordForm() {
  const [send, { isLoading, isSuccess, error }] = useForgotPasswordMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({ resolver: zodResolver(forgotPasswordSchema) });
  if (!env.passwordRecovery) return <FeatureUnavailable title="Password recovery" />;
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Forgot password?</h1>
      {isSuccess ? (
        <p role="status">
          If an account exists for that address, you’ll receive reset instructions.
        </p>
      ) : (
        <form
          className="space-y-5"
          onSubmit={handleSubmit(async (values) => {
            await send(values)
              .unwrap()
              .catch(() => undefined);
          })}
          noValidate
        >
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
          {error && <p role="alert">{apiErrorMessage(error)}</p>}
          <Button disabled={isLoading}>Send reset instructions</Button>
        </form>
      )}
      <Link href="/login" className="mt-6 block text-sm text-primary">
        Back to sign in
      </Link>
    </>
  );
}
export function ResetPasswordForm() {
  const params = useSearchParams();
  const [reset, { isLoading, isSuccess, error }] = useResetPasswordMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ password: string; confirmPassword: string }>({
    resolver: zodResolver(resetPasswordSchema),
  });
  if (!env.passwordRecovery) return <FeatureUnavailable title="Password recovery" />;
  const token = params.get('token');
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Choose a new password</h1>
      {!token ? (
        <p role="alert">This reset link is incomplete. Request a new link.</p>
      ) : isSuccess ? (
        <p role="status">Your password was reset. You can now sign in.</p>
      ) : (
        <form
          className="space-y-5"
          onSubmit={handleSubmit(async ({ password }) => {
            await reset({ token, password })
              .unwrap()
              .catch(() => undefined);
          })}
          noValidate
        >
          {(['password', 'confirmPassword'] as const).map((name) => (
            <FormField
              id={name}
              key={name}
              label={name === 'password' ? 'New password' : 'Confirm password'}
              error={errors[name]?.message}
            >
              <Input
                id={name}
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors[name]}
                aria-describedby={errors[name] ? `${name}-error` : undefined}
                {...register(name)}
              />
            </FormField>
          ))}
          {error && <p role="alert">{apiErrorMessage(error)}</p>}
          <Button disabled={isLoading}>Reset password</Button>
        </form>
      )}
      <Link href="/login" className="mt-6 block text-sm text-primary">
        Back to sign in
      </Link>
    </>
  );
}
