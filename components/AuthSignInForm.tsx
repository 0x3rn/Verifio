'use client';

import Link from 'next/link';
import { useClerk, useSignIn } from '@clerk/nextjs';
import { FormEvent, useState } from 'react';

function getClerkErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const message = (error as { longMessage?: unknown; message?: unknown }).longMessage ?? (error as { message?: unknown }).message;
  return typeof message === 'string' ? message : null;
}

function isAlreadySignedInError(error: unknown): boolean {
  return getClerkErrorMessage(error)?.toLowerCase().includes('already signed in') ?? false;
}

export function AuthSignInForm() {
  const clerk = useClerk();
  const { signIn, fetchStatus } = useSignIn();
  const isLoaded = fetchStatus !== 'fetching';
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

    if (!isLoaded) {
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
      const clearStaleSession = async () => {
        const staleSession = clerk.client?.sessions.find((session) => session.status === 'active');
        if (!staleSession) return false;
        await clerk.signOut({ sessionId: staleSession.id });
        await signIn.reset();
        return true;
      };

      await clearStaleSession();
      let result = await signIn.password({
        identifier: normalizedIdentifier,
        password: submittedPassword,
      });

      if (result.error && isAlreadySignedInError(result.error)) {
        if (!(await clearStaleSession())) {
          setErrorMessage('This browser already has a sign-in session, but it could not be restored. Refresh and try again.');
          return;
        }
        result = await signIn.password({
          identifier: normalizedIdentifier,
          password: submittedPassword,
        });
      }

      if (result.error) {
        setErrorMessage('Those sign-in details were not accepted. Check them and try again.');
        return;
      }

      if (signIn.status !== 'complete' || !signIn.createdSessionId) {
        setErrorMessage('This account needs another verification step. Please use the registration or recovery flow.');
        return;
      }

      const finalizeResult = await signIn.finalize({
        navigate: async () => undefined,
      });

      if (finalizeResult.error) {
        setErrorMessage('Clerk accepted the credentials, but the browser session could not be activated. Refresh and try again.');
        return;
      }

      window.location.assign('/dashboard');
    } catch {
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
