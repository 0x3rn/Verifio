'use client';

import Link from 'next/link';
import { useSignUp } from '@clerk/nextjs';
import { FormEvent, useState } from 'react';

const CLERK_REQUEST_TIMEOUT_MS = 20_000;

function withClerkTimeout<T>(operation: Promise<T>): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error('CLERK_REQUEST_TIMEOUT')), CLERK_REQUEST_TIMEOUT_MS);
  });

  return Promise.race([operation, timeout]).finally(() => {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  });
}

export function AuthSignUpForm() {
  const { signUp, fetchStatus } = useSignUp();
  const isLoaded = fetchStatus !== 'fetching';
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    if (!isLoaded) {
      setErrorMessage('Registration is still loading. Please try again in a moment.');
      return;
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedUsername || !password) {
      setErrorMessage('Enter a username and password to continue.');
      return;
    }
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage('Enter a valid email address or leave the email field blank.');
      return;
    }
    if (normalizedUsername.length < 3) {
      setErrorMessage('Your username must be at least 3 characters.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Your password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Your passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await withClerkTimeout(signUp.password({
        username: normalizedUsername,
        password,
        ...(normalizedEmail ? { emailAddress: normalizedEmail } : {}),
      }));

      if (result.error) {
        setErrorMessage('We could not create that account. Try a different username or check the form details.');
        return;
      }

      if (signUp.status !== 'complete' || !signUp.createdSessionId) {
        setErrorMessage('Additional verification is required before your account can be activated.');
        return;
      }

      const finalizeResult = await withClerkTimeout(signUp.finalize({
        navigate: async () => undefined,
      }));

      if (finalizeResult.error) {
        setErrorMessage('Your account was created, but the browser session could not be activated. Refresh and try again.');
        return;
      }

      window.location.assign('/dashboard');
    } catch (error) {
      setErrorMessage(error instanceof Error && error.message === 'CLERK_REQUEST_TIMEOUT'
        ? 'The authentication service did not respond. Check your connection and try again.'
        : 'We could not create that account. Try a different username or check the form details.');
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
        <label className="form-field__label" htmlFor="sign-up-email">Email address <span className="form-field__optional">(optional)</span></label>
        <input
          className="form-field__input"
          id="sign-up-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={!isLoaded || isSubmitting}
        />
      </div>

      <div>
        <label className="form-field__label" htmlFor="sign-up-username">Username</label>
        <input
          className="form-field__input"
          id="sign-up-username"
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          disabled={!isLoaded || isSubmitting}
          required
        />
      </div>

      <div>
        <label className="form-field__label" htmlFor="sign-up-password">Password</label>
        <input
          className="form-field__input"
          id="sign-up-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={!isLoaded || isSubmitting}
          required
        />
      </div>

      <div>
        <label className="form-field__label" htmlFor="sign-up-confirm-password">Confirm password</label>
        <input
          className="form-field__input"
          id="sign-up-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={!isLoaded || isSubmitting}
          required
        />
      </div>

      <button className="auth-submit" type="submit" disabled={!isLoaded || isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>

      <p className="auth-footer__text">
        Already have an account? <Link className="auth-footer__link" href="/login">Sign in</Link>
      </p>
    </form>
  );
}
