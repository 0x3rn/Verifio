'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldIcon, SpinnerIcon, MailIcon, LockIcon } from '@/components/Icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
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
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        setLoading(false);
        return;
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
          <Link href="/" className="auth-header__logo">
            <div className="auth-header__logo-icon">
              <ShieldIcon className="icon-lg text-white" />
            </div>
          </Link>
          <h1 className="auth-header__title">Welcome Back</h1>
          <p className="auth-header__subtitle">Sign in to your Verifio account to continue.</p>
        </div>

        <div className="auth-form-card">
          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div>
              <label htmlFor="email" className="form-field__label">Email Address</label>
              <div className="form-field__input-wrapper">
                <div className="form-field__icon">
                  <MailIcon className="icon-md" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
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
          </div>
        </div>
      </div>
    </div>
  );
}