'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { authClient, withAuthTimeout } from '@/lib/auth-client';
import { markFreshAuthNavigation } from '@/lib/fresh-auth-navigation';

function getAuthErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const candidate = error as { message?: unknown; code?: unknown };
  if (candidate.code === 'USERNAME_IS_ALREADY_TAKEN') return 'That username is already in use. Choose another one.';
  if (candidate.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') return 'That email address is already in use. Try signing in instead.';
  return typeof candidate.message === 'string' ? candidate.message : null;
}

export function AuthSignUpForm() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();
    if (!normalizedEmail || !normalizedUsername || !password) {
      setErrorMessage('Enter an email address, username, and password to continue.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    if (normalizedUsername.length < 3) {
      setErrorMessage('Your username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(normalizedUsername)) {
      setErrorMessage('Usernames can contain letters, numbers, underscores, and periods.');
      return;
    }
    if (password.length < 15) {
      setErrorMessage('Your password must be at least 15 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Your passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await withAuthTimeout(authClient.signUp.email({
        email: normalizedEmail,
        name: normalizedUsername,
        username: normalizedUsername,
        displayUsername: normalizedUsername,
        password,
        callbackURL: '/dashboard',
      }));

      if (result.error) {
        setErrorMessage(getAuthErrorMessage(result.error) || 'We could not create that account. Check your details and try again.');
        return;
      }

      markFreshAuthNavigation();
      window.location.assign('/dashboard');
    } catch (error) {
      setErrorMessage(error instanceof Error && error.message === 'AUTH_REQUEST_TIMEOUT'
        ? 'The authentication service did not respond. Check your connection and try again.'
        : 'We could not create that account. Check your details and try again.');
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
        <label className="form-field__label" htmlFor="sign-up-email">Email address</label>
        <input
          className="form-field__input"
          id="sign-up-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          required
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
          disabled={isSubmitting}
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
          disabled={isSubmitting}
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
          disabled={isSubmitting}
          required
        />
      </div>

      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>

      <p className="auth-footer__text">
        Already have an account? <Link className="auth-footer__link" href="/login">Sign in</Link>
      </p>
    </form>
  );
}
