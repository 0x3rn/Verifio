'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { authClient, withAuthTimeout } from '@/lib/auth-client';

function getAuthErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const candidate = error as { message?: unknown; code?: unknown };
  if (candidate.code === 'INVALID_USERNAME_OR_PASSWORD' || candidate.code === 'INVALID_EMAIL_OR_PASSWORD') {
    return 'Those sign-in details were not accepted. Check them and try again.';
  }
  return typeof candidate.message === 'string' ? candidate.message : null;
}

export function AuthSignInForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier || !password) {
      setErrorMessage('Enter your username or email and password to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = normalizedIdentifier.includes('@')
        ? await withAuthTimeout(authClient.signIn.email({ email: normalizedIdentifier.toLowerCase(), password, callbackURL: '/dashboard' }))
        : await withAuthTimeout(authClient.signIn.username({ username: normalizedIdentifier, password, callbackURL: '/dashboard' }));

      if (result.error) {
        setErrorMessage(getAuthErrorMessage(result.error) || 'Those sign-in details were not accepted. Check them and try again.');
        return;
      }

      window.location.assign('/dashboard');
    } catch (error) {
      setErrorMessage(error instanceof Error && error.message === 'AUTH_REQUEST_TIMEOUT'
        ? 'The authentication service did not respond. Check your connection and try again.'
        : 'Those sign-in details were not accepted. Check them and try again.');
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
          disabled={isSubmitting}
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
          disabled={isSubmitting}
          required
        />
      </div>

      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="auth-footer__text">
        Don&apos;t have an account? <Link className="auth-footer__link" href="/register">Create an account</Link>
      </p>
    </form>
  );
}
