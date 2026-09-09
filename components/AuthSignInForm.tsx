'use client';

import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

function getClerkErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('errors' in error)) return null;
  const errors = (error as { errors?: unknown }).errors;
  if (!Array.isArray(errors) || !errors[0] || typeof errors[0] !== 'object') return null;
  const code = (errors[0] as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

export function AuthSignInForm() {
  const router = useRouter();
  const clerk = useClerk();
  const isLoaded = clerk.loaded;
  const signIn = clerk.client?.signIn;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    const formData = new FormData(event.currentTarget);
    const submittedIdentifier = String(formData.get('identifier') ?? '');
    const submittedPassword = String(formData.get('password') ?? '');

    if (!isLoaded || !signIn) {
      setErrorMessage('Sign-in is still loading. Please try again in a moment.');
      return;
    }

    const normalizedIdentifier = submittedIdentifier.trim();
    if (!normalizedIdentifier || !submittedPassword) {
      setErrorMessage('Enter your username or email and password to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn.create({
        strategy: 'password',
        identifier: normalizedIdentifier,
        password: submittedPassword,
      });

      if (result.status !== 'complete' || !result.createdSessionId) {
        setErrorMessage('This account needs another verification step. Please use the registration or recovery flow.');
        return;
      }

      try {
        await clerk.setActive({ session: result.createdSessionId });
      } catch {
        setErrorMessage('Clerk accepted the credentials, but the browser session could not be activated. Refresh and try again.');
        return;
      }

      router.replace('/dashboard');
    } catch (error) {
      const code = getClerkErrorCode(error);
      if (code === 'session_exists') {
        const activeSession = clerk.client?.sessions.find((session) => session.status === 'active');
        if (activeSession) {
          try {
            await clerk.setActive({ session: activeSession.id });
            router.replace('/dashboard');
            return;
          } catch {
            setErrorMessage('An existing browser session could not be restored. Refresh and try again.');
            return;
          }
        }
      }

      setErrorMessage('Those sign-in details were not accepted. Check them and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-form__error-slot" aria-live="polite">
        {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}
      </div>

      <div>
        <label className="form-field__label" htmlFor="sign-in-identifier">Username or email</label>
        <input
          className="form-field__input"
          id="sign-in-identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          disabled={!isLoaded || isSubmitting}
          required
        />
      </div>

      <div>
        <label className="form-field__label" htmlFor="sign-in-password">Password</label>
        <input
          className="form-field__input"
          id="sign-in-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={!isLoaded || isSubmitting}
          required
        />
      </div>

      <button className="auth-submit" type="submit" disabled={!isLoaded || isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="auth-footer__text">
        Don&apos;t have an account? <Link className="auth-footer__link" href="/register">Create an account</Link>
      </p>
    </form>
  );
}
