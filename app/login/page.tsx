'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SpinnerIcon, MailIcon, LockIcon, UserIcon } from '@/components/Icons';
import { identifyUser, trackEvent, resetUser } from '@/lib/posthog';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      // PostHog: identify user & track login
      if (data.user) {
        identifyUser(data.user.id, {
          username: data.user.username,
          email: data.user.email || undefined,
        });
        trackEvent('User Logged In', {
          method: 'password',
          username: data.user.username,
        });
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-header__title">Welcome Back</h1>
          <p className="auth-header__subtitle">Sign in to your Verifio account to continue.</p>
        </div>

        <div className="auth-form-card">
          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div>
              <label htmlFor="username" className="form-field__label">Username</label>
              <div className="form-field__input-wrapper">
                <div className="form-field__icon">
                  <UserIcon className="icon-md" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="johndoe123"
                  className="form-field__input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="form-field__label">Password</label>
              <div className="form-field__input-wrapper">
                <div className="form-field__icon">
                  <LockIcon className="icon-md" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="form-field__input"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? (
                <span className="auth-submit__inner">
                  <SpinnerIcon className="icon-md" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-footer__text">
              Don't have an account?{' '}
              <Link href="/register" className="auth-footer__link">Create one</Link>
            </p>
            <p className="auth-footer__text" style={{ marginTop: '0.5rem' }}>
              <Link href="/" className="auth-footer__link">← Back to Home</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}