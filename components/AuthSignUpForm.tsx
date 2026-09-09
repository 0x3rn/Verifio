'use client';

import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function AuthSignUpForm() {
  const router = useRouter();
  const clerk = useClerk();
  const isLoaded = clerk.loaded;
  const signUp = clerk.client?.signUp;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    if (!isLoaded || !signUp) {
      setErrorMessage('Registration is still loading. Please try again in a moment.');
      return;
    }

    const normalizedUsername = username.trim();
    if (!normalizedUsername || !password) {
      setErrorMessage('Enter a username and password to continue.');
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
      const result = await signUp.create({ username: normalizedUsername, password });

      if (result.status !== 'complete' || !result.createdSessionId) {
        setErrorMessage('Additional verification is required before your account can be activated.');
        return;
      }

      await clerk.setActive({ session: result.createdSessionId });
      router.replace('/dashboard');
    } catch {
      setErrorMessage('We could not create that account. Try a different username or check the form details.');
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
