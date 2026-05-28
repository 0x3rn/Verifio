'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldIcon, SpinnerIcon, MailIcon, LockIcon, UserIcon } from '@/components/Icons';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        setLoading(false);
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
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
          <h1 className="auth-header__title">Create Account</h1>
          <p className="auth-header__subtitle">Start verifying in less than a minute.</p>
        </div>

        <div className="auth-form-card">
          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div>
              <label htmlFor="name" className="form-field__label">Full Name</label>
              <div className="form-field__input-wrapper">
                <div className="form-field__icon">
                  <UserIcon className="icon-md" />
                </div>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" className="form-field__input" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="form-field__label">Email Address</label>
              <div className="form-field__input-wrapper">
                <div className="form-field__icon">
                  <MailIcon className="icon-md" />
                </div>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="form-field__input" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="form-field__label">Password</label>
              <div className="form-field__input-wrapper">
                <div className="form-field__icon">
                  <LockIcon className="icon-md" />
                </div>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min. 8 characters" className="form-field__input" />
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="form-field__label">Confirm Password</label>
              <div className="form-field__input-wrapper">
                <div className="form-field__icon">
                  <LockIcon className="icon-md" />
                </div>
                <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Repeat your password" className="form-field__input" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? <span className="auth-submit__inner"><SpinnerIcon className="icon-md" /> Creating account...</span> : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-footer__text">
              Already have an account?{' '}
              <Link href="/login" className="auth-footer__link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}