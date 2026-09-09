'use client';

import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

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

    if (!isLoaded || !signIn) {
      setErrorMessage('Sign-in is still loading. Please try again in a moment.');
      return;
    }

    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier || !password) {
      setErrorMessage('Enter your username or email and password to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn.create({
        strategy: 'password',
        identifier: normalizedIdentifier,
        password,
      });

      if (result.status !== 'complete' || !result.createdSessionId) {
        setErrorMessage('This account needs another verification step. Please use the registration or recovery flow.');
        return;
      }

      await clerk.setActive({ session: result.createdSessionId });
      router.replace('/dashboard');
    } catch {
      setErrorMessage('Those sign-in details were not accepted. Check them and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {errorMessage ? (
        <p className="auth-error" role="alert">{errorMessage}</p>
      ) : null}

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
