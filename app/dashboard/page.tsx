'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SpinnerIcon, HomeIcon, ClipboardIcon, PhoneIcon, WalletIcon, ChartIcon, ClockIcon, RefreshIcon, ArrowLeftIcon } from '@/components/Icons';
import { SUPPORTED_SERVICES, SUPPORTED_COUNTRIES, PLAN_DURATIONS } from '@/lib/types';
import type { User, PlanTier } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sms' | 'voice' | 'rental'>('sms');
  const [selectedService, setSelectedService] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countryLoading, setCountryLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('monthly');
  const [orderResult, setOrderResult] = useState<{
    id: string; phoneNumber: string; service: string; country: string; status: string; cost: number; expiresAt: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [checkingCode, setCheckingCode] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [working, setWorking] = useState(false);

  const [serviceSearch, setServiceSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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

  // Auto-detect country from IP on mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch('/api/geo');
        if (res.ok) {
          const data = await res.json();
          if (data.country) {
            // Only auto-select if it's in our supported list
            const isSupported = SUPPORTED_COUNTRIES.some(c => c.code === data.country);
            if (isSupported) setSelectedCountry(data.country);
          }
        }
      } catch { /* silently fail, user can pick manually */ }
      finally { setCountryLoading(false); }
    };
    detectCountry();
  }, []);

  const handleOrder = useCallback(async () => {
    if (!selectedService || !selectedCountry) {
      setStatusMessage('Please select a service and country.');
      return;
    }
    setWorking(true);
    setStatusMessage('Ordering number...');
    setOrderResult(null);
    setVerificationCode('');

    try {
      const endpoint = activeTab === 'voice' ? '/api/verify/voice' : '/api/verify/sms';
      const body: Record<string, string> = { country: selectedCountry, service: selectedService };
      if (activeTab === 'rental') body.plan = selectedPlan;

      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) { setStatusMessage(data.error || 'Failed to order.'); setWorking(false); return; }
      setOrderResult(data.order);
      setStatusMessage(`Number acquired. Use ${data.order.phoneNumber} to request your code.`);
    } catch { setStatusMessage('An unexpected error occurred.'); }
    finally { setWorking(false); }
  }, [selectedService, selectedCountry, selectedPlan, activeTab]);

  const handleCheckCode = useCallback(async () => {
    if (!orderResult) return;
    setCheckingCode(true);
    setStatusMessage('Checking for verification code...');
    try {
      const endpoint = activeTab === 'voice' ? '/api/verify/voice' : '/api/verify/sms';
      const res = await fetch(`${endpoint}?orderId=${orderResult.id}`);
      const data = await res.json();
      if (!res.ok) { setStatusMessage(data.error || 'Failed to check code.'); setCheckingCode(false); return; }
      if (data.success && data.code) { setVerificationCode(data.code); setStatusMessage('Verification code received!'); }
      else if (data.status === 'expired') { setStatusMessage('Order expired. Create a new order.'); setOrderResult(null); }
      else { setStatusMessage('Code not yet received. Keep waiting...'); }
    } catch { setStatusMessage('Failed to check for code.'); }
    finally { setCheckingCode(false); }
  }, [orderResult, activeTab]);

  const handleCancelOrder = useCallback(async () => {
    if (!orderResult) return;
    setWorking(true);
    try {
      const endpoint = activeTab === 'voice' ? '/api/verify/voice' : '/api/verify/sms';
      await fetch(`${endpoint}?orderId=${orderResult.id}`, { method: 'DELETE' });
      setOrderResult(null); setVerificationCode(''); setStatusMessage('Order cancelled.');
    } catch { setStatusMessage('Failed to cancel order.'); }
    finally { setWorking(false); }
  }, [orderResult, activeTab]);

  if (loading) {
    return (
      <div className="auth-page">
        <SpinnerIcon className="spinner--lg spinner--indigo" />
      </div>
    );
  }
  if (!user) return null;

  const statusModifier = statusMessage.includes('received')
    ? 'status-msg--success'
    : statusMessage.includes('error') || statusMessage.includes('failed')
    ? 'status-msg--error'
    : 'status-msg--info';

  return (
    <div className="dashboard page-container">
      {/* Header */}
      <div className="dashboard__header">
        <h1 className="dashboard__title">Welcome back, {user.username}</h1>
        <p className="dashboard__subtitle">Start a new verification or manage your existing ones.</p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        {[
          { label: 'Balance', value: `$${user.balance.toFixed(2)}`, Icon: WalletIcon },
          { label: 'Total Orders', value: '0', Icon: ClipboardIcon },
          { label: 'Active Rentals', value: '0', Icon: PhoneIcon },
          { label: 'Completed', value: '0', Icon: ChartIcon, color: true },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-card__header">
              <stat.Icon className="icon-md stat-card__icon" />
              <span className="stat-card__label">{stat.label}</span>
            </div>
            <div className={`stat-card__value ${stat.color ? 'stat-card__value--success' : ''}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Main verification form */}
        <div>
          <div className="dashboard-form-card">
            <h2 className="dashboard-form-card__title">New Verification</h2>

            {/* Type tabs */}
            <div className="verification-tabs">
              {(['sms', 'voice', 'rental'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setOrderResult(null); setVerificationCode(''); }}
                  className={`verification-tab ${activeTab === tab ? 'verification-tab--active' : ''}`}
                >
                  {tab === 'sms' && (
                    <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  )}
                  {tab === 'voice' && (
                    <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  )}
                  {tab === 'rental' && (
                    <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  )}
                  {tab === 'sms' ? 'SMS' : tab === 'voice' ? 'Voice' : 'Rental'}
                </button>
              ))}
            </div>

            {/* Service selection */}
            <div className="selector-section">
              <label className="selector-section__label">Select Service</label>
              <div className="selector-section__search">
                <input
                  type="text"
                  placeholder="Search service... (e.g. Google, WhatsApp, Telegram)"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="selector-search-input"
                />
              </div>
              <div className="selector-grid">
                {SUPPORTED_SERVICES.filter(svc => svc.name.toLowerCase().includes(serviceSearch.toLowerCase())).map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedService(svc.id)}
                    className={`selector-btn ${selectedService === svc.id ? 'selector-btn--active' : ''}`}
                  >
                    {svc.name}
                  </button>
                ))}
                {SUPPORTED_SERVICES.filter(svc => svc.name.toLowerCase().includes(serviceSearch.toLowerCase())).length === 0 && (
                  <div className="selector-empty">No services match your search.</div>
                )}
              </div>
            </div>

            {/* Country selection */}
            <div className="selector-section">
              <label className="selector-section__label">
                Select Country
                {countryLoading && <span className="selector-section__loading"> — detecting your location...</span>}
                {!countryLoading && selectedCountry && <span className="selector-section__detected"> (auto-detected)</span>}
              </label>
              <div className="selector-section__search">
                <input
                  type="text"
                  placeholder="Search country... (e.g. United States, Germany)"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="selector-search-input"
                />
              </div>
              <div className="selector-grid">
                {SUPPORTED_COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCountry(c.code)}
                    className={`selector-btn ${selectedCountry === c.code ? 'selector-btn--active' : ''}`}
                  >
                    {c.name}
                  </button>
                ))}
                {SUPPORTED_COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 && (
                  <div className="selector-empty">No countries match your search.</div>
                )}
              </div>
            </div>

            {/* Plan selection for rentals */}
            {activeTab === 'rental' && (
              <div className="selector-section">
                <label className="selector-section__label">Select Plan</label>
                <div className="selector-grid selector-grid--2col">
                  {Object.entries(PLAN_DURATIONS).map(([key, plan]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedPlan(key as PlanTier)}
                      className={`selector-btn ${selectedPlan === key ? 'selector-btn--active' : ''}`}
                    >
                      <div className="selector-plan__label">{plan.label}</div>
                      <div className="selector-plan__days">{plan.days} days</div>
                      {plan.discount > 0 && <div className="selector-plan__discount">-{plan.discount}%</div>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Order button */}
            <button
              onClick={handleOrder}
              disabled={working || !selectedService || !selectedCountry}
              className="dashboard-submit"
            >
              {working ? 'Processing...' : `Get ${activeTab === 'rental' ? 'Rental' : activeTab === 'voice' ? 'Voice' : 'SMS'} Number`}
            </button>

            {/* Status */}
            {statusMessage && (
              <div className={`status-msg ${statusModifier}`}>{statusMessage}</div>
            )}

            {/* Order result */}
            {orderResult && (
              <div className="active-order">
                <h3 className="active-order__title">Active Order</h3>
                <div className="active-order__grid">
                  <div>
                    <div className="active-order__field-label">Phone Number</div>
                    <div className="active-order__phone-row">
                      <span className="active-order__phone">{orderResult.phoneNumber}</span>
                      <button
                        onClick={() => handleCopyNumber(orderResult.phoneNumber)}
                        className="copy-btn"
                        title="Copy Phone Number"
                      >
                        {copiedNumber ? (
                          <span className="copy-btn__label">Copied!</span>
                        ) : (
                          <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="active-order__field-label">Cost</div>
                    <div className="active-order__cost">${orderResult.cost.toFixed(2)}</div>
                  </div>
                </div>

                {verificationCode ? (
                  <div className="code-display">
                    <div>
                      <div className="code-display__label">Verification Code</div>
                      <div className="code-display__value">{verificationCode}</div>
                    </div>
                    <button
                      onClick={() => handleCopyCode(verificationCode)}
                      className="code-display__copy-btn"
                    >
                      {copiedCode ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleCheckCode}
                    disabled={checkingCode}
                    className="check-code-btn"
                  >
                    {checkingCode ? <span className="check-code-btn__inner"><SpinnerIcon className="icon-md" /> Checking...</span> : 'Check for Code'}
                  </button>
                )}

                <button onClick={handleCancelOrder} disabled={working} className="cancel-btn">
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Quick links */}
          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Quick Links</h3>
            <div className="sidebar-links">
              <Link href="/dashboard/orders" className="sidebar-link">
                <ClipboardIcon className="icon-md sidebar-link__icon" /> Order History
              </Link>
              <Link href="/dashboard/rentals" className="sidebar-link">
                <PhoneIcon className="icon-md sidebar-link__icon" /> My Rentals
              </Link>
            </div>
          </div>

          {/* Account info */}
          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Account</h3>
            <div className="account-info">
              <div className="account-info__row">
                <span className="account-info__label">Username</span>
                <span className="account-info__value">{user.username}</span>
              </div>
              <div className="account-info__row">
                <span className="account-info__label">Email</span>
                <span className="account-info__value">{user.email || '—'}</span>
              </div>
              <div className="account-info__row">
                <span className="account-info__label">Balance</span>
                <span className="account-info__value account-info__value--bold">${user.balance.toFixed(2)}</span>
              </div>
              <div className="account-info__row">
                <span className="account-info__label">Member since</span>
                <span className="account-info__value">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}