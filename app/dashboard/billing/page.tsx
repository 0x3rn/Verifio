'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WalletIcon, ClipboardIcon, PhoneIcon, ArrowLeftIcon, SpinnerIcon } from '@/components/Icons';
import type { User } from '@/lib/types';

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string>('10');
  const [customAmount, setCustomAmount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  // Check for success param in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === '1') {
        setSuccess(true);
      }
    }
  }, []);

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 5) {
      setError('Minimum deposit is $5.00.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/billing/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create deposit.');
        setSubmitting(false);
        return;
      }

      // Redirect to Cryptomus payment page
      if (data.payment?.paymentUrl) {
        window.location.href = data.payment.paymentUrl;
      } else {
        setError('No payment URL received.');
        setSubmitting(false);
      }
    } catch {
      setError('An unexpected error occurred.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <SpinnerIcon className="spinner--lg spinner--indigo" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="sub-page page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/dashboard" className="breadcrumb__link">
          <ArrowLeftIcon className="icon-sm" /> Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="sub-page-header">
        <div>
          <h1 className="sub-page-header__title">Add Funds</h1>
          <p className="sub-page-header__subtitle">
            Deposit cryptocurrency to fund your verification orders.
          </p>
        </div>
      </div>

      {/* Balance card */}
      <div className="billing-balance">
        <div className="billing-balance__card">
          <WalletIcon className="icon-xl" />
          <div>
            <div className="billing-balance__label">Current Balance</div>
            <div className="billing-balance__value">${user.balance.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="billing-success">
          <div className="billing-success__icon">✓</div>
          <div className="billing-success__title">Payment Submitted!</div>
          <div className="billing-success__desc">
            Your payment is being processed. Your balance will update once the transaction is confirmed.
          </div>
        </div>
      )}

      {/* Deposit form */}
      <div className="billing-form">
        <h2 className="billing-form__title">Deposit Amount</h2>

        {error && (
          <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>
        )}

        {/* Preset amounts */}
        <div className="billing-presets">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              onClick={() => { setAmount(String(preset)); setCustomAmount(false); }}
              className={`selector-btn ${!customAmount && amount === String(preset) ? 'selector-btn--active' : ''}`}
            >
              ${preset}
            </button>
          ))}
          <button
            onClick={() => { setAmount(''); setCustomAmount(true); }}
            className={`selector-btn ${customAmount ? 'selector-btn--active' : ''}`}
          >
            Custom
          </button>
        </div>

        {/* Custom amount input */}
        {customAmount && (
          <div className="billing-custom">
            <label className="form-field__label">Enter Amount (USD)</label>
            <div className="billing-custom__input-wrapper">
              <span className="billing-custom__dollar">$</span>
              <input
                type="number"
                min="5"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10.00"
                className="billing-custom__input"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Deposit button */}
        <button
          onClick={handleDeposit}
          disabled={submitting}
          className="dashboard-submit"
          style={{ marginTop: '1.5rem' }}
        >
          {submitting ? (
            <span className="auth-submit__inner">
              <SpinnerIcon className="icon-md" /> Creating payment...
            </span>
          ) : (
            `Deposit $${parseFloat(amount || '0').toFixed(2)}`
          )}
        </button>

        <p className="billing-disclaimer">
          You will be redirected to Cryptomus to complete your payment. Minimum deposit: $5.00.
        </p>
      </div>
    </div>
  );
}