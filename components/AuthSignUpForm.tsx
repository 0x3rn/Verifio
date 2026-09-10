'use client';

import Link from 'next/link';
import { useSignUp } from '@clerk/nextjs';
import { FormEvent, useState } from 'react';
import { withClerkTimeout } from '@/lib/clerk-client';

export function AuthSignUpForm() {
  const { signUp, fetchStatus } = useSignUp();
  const isLoaded = fetchStatus !== 'fetching';
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailCode, setEmailCode] = useState('');

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
      const result = await withClerkTimeout(signUp.password({
        username: normalizedUsername,
        password,
        ...(normalizedEmail ? { emailAddress: normalizedEmail } : {}),
      }));

      if (result.error) {
        setErrorMessage('We could not create that account. Try a different username or check the form details.');
        return;
      }

      if (signUp.status === 'missing_requirements'
        && signUp.unverifiedFields.includes('email_address')
        && signUp.missingFields.length === 0) {
        const verificationResult = await withClerkTimeout(signUp.verifications.sendEmailCode());
        if (verificationResult.error) {
          setErrorMessage('We could not send the verification code. Check your email address and try again.');
          return;
        }
        setIsVerifyingEmail(true);
        return;
      }

      if (signUp.status !== 'complete' || !signUp.createdSessionId) {
        setErrorMessage('Additional verification is required before your account can be activated.');
        return;
      }

      const finalizeResult = await withClerkTimeout(signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          window.location.assign(decorateUrl('/dashboard'));
        },
      }));

      if (finalizeResult.error) {
        setErrorMessage('Your account was created, but the browser session could not be activated. Refresh and try again.');
        return;
      }

    } catch (error) {
      setErrorMessage(error instanceof Error && error.message === 'CLERK_REQUEST_TIMEOUT'
        ? 'The authentication service did not respond. Check your connection and try again.'
        : 'We could not create that account. Try a different username or check the form details.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    const normalizedCode = emailCode.replace(/\s/g, '');
    if (!/^\d{4,8}$/.test(normalizedCode)) {
      setErrorMessage('Enter the verification code sent to your email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const verificationResult = await withClerkTimeout(signUp.verifications.verifyEmailCode({ code: normalizedCode }));
      if (verificationResult.error) {
        setErrorMessage('That verification code was not accepted. Check it and try again.');
        return;
      }

      if (signUp.status !== 'complete' || !signUp.createdSessionId) {
        setErrorMessage('Your email was verified, but the account is not ready yet. Please try again.');
        return;
      }

      const finalizeResult = await withClerkTimeout(signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          window.location.assign(decorateUrl('/dashboard'));
        },
      }));
      if (finalizeResult.error) {
        setErrorMessage('Your account was created, but the browser session could not be activated. Refresh and try again.');
        return;
      }

    } catch (error) {
      setErrorMessage(error instanceof Error && error.message === 'CLERK_REQUEST_TIMEOUT'
        ? 'The authentication service did not respond. Check your connection and try again.'
        : 'We could not verify your email. Check the code and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendEmailCode() {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const result = await withClerkTimeout(signUp.verifications.sendEmailCode());
      setErrorMessage(result.error ? 'We could not send a new code. Please try again.' : 'A new verification code was sent.');
    } catch (error) {
      setErrorMessage(error instanceof Error && error.message === 'CLERK_REQUEST_TIMEOUT'
        ? 'The authentication service did not respond. Check your connection and try again.'
        : 'We could not send a new code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isVerifyingEmail) {
    return (
      <form className="auth-form" onSubmit={handleVerifyEmail} noValidate>
        <div className="auth-form__error-slot" aria-live="polite">
          {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}
        </div>
        <p className="auth-verification-hint">We sent a verification code to your email address.</p>
        <div>
          <label className="form-field__label" htmlFor="sign-up-email-code">Verification code</label>
          <input
            className="form-field__input"
            id="sign-up-email-code"
            name="emailCode"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={emailCode}
            onChange={(event) => setEmailCode(event.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying…' : 'Verify email'}
        </button>
        <button className="auth-secondary-button" type="button" onClick={handleResendEmailCode} disabled={isSubmitting}>
          Send a new code
        </button>
      </form>
    );
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

      <div id="clerk-captcha" />

      <p className="auth-footer__text">
        Already have an account? <Link className="auth-footer__link" href="/login">Sign in</Link>
      </p>
    </form>
  );
}
