'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@/lib/validations/auth';
import type { Registration } from '@/types/auth';
import { useRegisterMutation } from '@/store/api/authApi';
import { apiErrorMessage } from '@/lib/api/errors';
import { FormField } from '@/components/common/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export function RegisterForm() {
  const router = useRouter();
  const [create, { isLoading, error }] = useRegisterMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Registration>({ resolver: zodResolver(registerSchema) });
  async function submit(values: Registration) {
    try {
      await create(values).unwrap();
      router.replace('/account');
    } catch {
      /* Error rendered below. */
    }
  }
  return (
    <>
      <h1 className="text-3xl font-bold">Make yourself at home</h1>
      <p className="mt-3 mb-8 text-muted-foreground">Create your Elementry Media account.</p>
      <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
        {(
          [
            { name: 'name', label: 'Full name', type: 'text', complete: 'name' },
            { name: 'email', label: 'Email address', type: 'email', complete: 'email' },
            { name: 'password', label: 'Password', type: 'password', complete: 'new-password' },
          ] as const
        ).map((field) => (
          <FormField
            key={field.name}
            id={field.name}
            label={field.label}
            error={errors[field.name]?.message}
          >
            <Input
              id={field.name}
              type={field.type}
              autoComplete={field.complete}
              aria-invalid={!!errors[field.name]}
              aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
              {...register(field.name)}
            />
          </FormField>
        ))}
        <p className="text-xs text-muted-foreground">
          Use at least 12 characters for your password.
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {apiErrorMessage(error)}
          </p>
        )}
        <Button className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
    </>
  );
}
