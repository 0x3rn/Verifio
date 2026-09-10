'use client';

import Link from 'next/link';
import { useClerk, useSignIn } from '@clerk/nextjs';
import { FormEvent, useState } from 'react';
import { withClerkTimeout } from '@/lib/clerk-client';

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
  const [needsDeviceTrust, setNeedsDeviceTrust] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

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
        await withClerkTimeout(clerk.signOut({ sessionId: staleSession.id }));
        await withClerkTimeout(signIn.reset());
        return true;
      };

      await clearStaleSession();
      let result = await withClerkTimeout(signIn.password({
        identifier: normalizedIdentifier,
        password: submittedPassword,
      }));

      if (result.error && isAlreadySignedInError(result.error)) {
        if (!(await clearStaleSession())) {
          setErrorMessage('This browser already has a sign-in session, but it could not be restored. Refresh and try again.');
          return;
        }
        result = await withClerkTimeout(signIn.password({
          identifier: normalizedIdentifier,
          password: submittedPassword,
        }));
      }

      if (result.error) {
        setErrorMessage('Those sign-in details were not accepted. Check them and try again.');
        return;
      }

      if (signIn.status === 'needs_client_trust') {
        const emailFactor = signIn.supportedSecondFactors.find((factor) => factor.strategy === 'email_code');
        if (!emailFactor) {
          setErrorMessage('This account requires an additional verification method that is not available here.');
          return;
        }
        const verificationResult = await withClerkTimeout(signIn.mfa.sendEmailCode());
        if (verificationResult.error) {
          setErrorMessage('We could not send the device verification code. Please try again.');
          return;
        }
        setNeedsDeviceTrust(true);
        return;
      }

      if (signIn.status !== 'complete' || !signIn.createdSessionId) {
        setErrorMessage('This account needs another verification step. Please use the registration or recovery flow.');
        return;
      }

      await withClerkTimeout(clerk.setActive({
        session: signIn.createdSessionId,
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          window.location.assign(decorateUrl('/dashboard'));
        },
      }));

    } catch (error) {
      setErrorMessage(error instanceof Error && error.message === 'CLERK_REQUEST_TIMEOUT'
        ? 'The authentication service did not respond. Check your connection and try again.'
        : 'Those sign-in details were not accepted. Check them and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    const normalizedCode = verificationCode.replace(/\s/g, '');
    if (!/^\d{4,8}$/.test(normalizedCode)) {
      setErrorMessage('Enter the verification code sent to your email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await withClerkTimeout(signIn.mfa.verifyEmailCode({ code: normalizedCode }));
      if (result.error) {
        setErrorMessage('That verification code was not accepted. Check it and try again.');
        return;
      }
      if (signIn.status !== 'complete' || !signIn.createdSessionId) {
        setErrorMessage('The device could not be verified. Please try again.');
        return;
      }
      await withClerkTimeout(clerk.setActive({
        session: signIn.createdSessionId,
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          window.location.assign(decorateUrl('/dashboard'));
        },
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error && error.message === 'CLERK_REQUEST_TIMEOUT'
        ? 'The authentication service did not respond. Check your connection and try again.'
        : 'We could not verify this device. Check the code and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (needsDeviceTrust) {
    return (
      <form className="auth-form" onSubmit={handleVerifyDevice} noValidate>
        <div className="auth-form__error-slot" aria-live="polite">
          {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}
        </div>
        <p className="auth-verification-hint">We sent a verification code to the email address on your account.</p>
        <div>
          <label className="form-field__label" htmlFor="sign-in-verification-code">Verification code</label>
          <input
            className="form-field__input"
            id="sign-in-verification-code"
            name="verificationCode"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying…' : 'Verify device'}
        </button>
        <button className="auth-secondary-button" type="button" onClick={async () => {
          setErrorMessage('');
          setIsSubmitting(true);
          try {
            const result = await withClerkTimeout(signIn.mfa.sendEmailCode());
            if (result.error) setErrorMessage('We could not send a new code. Please try again.');
            else setErrorMessage('A new verification code was sent.');
          } catch (error) {
            setErrorMessage(error instanceof Error && error.message === 'CLERK_REQUEST_TIMEOUT'
              ? 'The authentication service did not respond. Check your connection and try again.'
              : 'We could not send a new code. Please try again.');
          } finally {
            setIsSubmitting(false);
          }
        }} disabled={isSubmitting}>
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
