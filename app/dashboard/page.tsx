'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SpinnerIcon, HomeIcon, ClipboardIcon, PhoneIcon, WalletIcon, ChartIcon } from '@/components/Icons';
import { SUPPORTED_SERVICES, SUPPORTED_COUNTRIES, PLAN_DURATIONS } from '@/lib/types';
import type { User, PlanTier } from '@/lib/types';
import { identifyUser, trackEvent } from '@/lib/posthog';

interface SelectableItem {
  id: string;
  name: string;
}

const POPULAR_SERVICE_IDS = ['google', 'whatsapp', 'telegram', 'discord', 'facebook', 'instagram', 'twitter', 'microsoft'];
const POPULAR_COUNTRY_CODES = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'NL', 'SE'];

function PickerModal({
  items, search, onSearchChange, selected, onSelect, onClose, label,
}: {
  items: SelectableItem[]; search: string; onSearchChange: (v: string) => void;
  selected: string; onSelect: (id: string) => void; onClose: () => void; label: string;
}) {
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="picker-modal-overlay" onClick={onClose}>
      <div className="picker-modal" onClick={e => e.stopPropagation()}>
        <div className="picker-modal__header">
          <span className="picker-modal__title">{label}</span>
          <button onClick={onClose} className="picker-modal__close" aria-label="Close">✕</button>
        </div>
        <input type="text" placeholder={`Search ${label.toLowerCase()}...`} value={search}
          onChange={e => onSearchChange(e.target.value)} className="picker-modal__search" autoFocus />
        <div className="picker-modal__list">
          {filtered.length === 0 && <div className="selector-empty">Nothing matches your search.</div>}
          {filtered.map(item => (
            <button key={item.id} onClick={() => { onSelect(item.id); onClose(); }}
              className={`picker-modal__item ${selected === item.id ? 'picker-modal__item--active' : ''}`}>
              {item.name}
              {selected === item.id && <span className="picker-modal__check">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasIdentified, setHasIdentified] = useState(false);
  const [activeTab, setActiveTab] = useState<'sms' | 'voice' | 'rental'>('sms');
  const [selectedService, setSelectedService] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [services, setServices] = useState<SelectableItem[]>(SUPPORTED_SERVICES);
  const [countries, setCountries] = useState<SelectableItem[]>(SUPPORTED_COUNTRIES.map(c => ({ id: c.code, name: c.name })));
  const [listsLoading, setListsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('monthly');
  const [orderResult, setOrderResult] = useState<{
    id: string; phoneNumber: string; rawNumber?: string; service: string; country: string; status: string; cost: number; expiresAt: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [checkingCode, setCheckingCode] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [working, setWorking] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [pricing, setPricing] = useState<{ basePrice: number; displayPrice: number; successRate?: number } | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
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
        if (res.ok) { const data = await res.json(); setUser(data.user); }
        else { router.push('/login'); }
      } catch { router.push('/login'); }
      finally { setLoading(false); }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.services)) setServices(data.services.map((s: { ID: number; name: string }) => ({ id: s.name.toLowerCase(), name: s.name })));
          if (Array.isArray(data.countries)) setCountries(data.countries.map((c: { ID: number; code: string; name: string; short_name: string }) => ({ id: c.code || c.short_name, name: c.name })));
        }
      } catch { /* fallback */ }
      finally { setListsLoading(false); }
    };
    fetchLists();
  }, []);

  useEffect(() => { if (user && !hasIdentified) { identifyUser(user.id, { username: user.username, email: user.email || undefined }); setHasIdentified(true); } }, [user, hasIdentified]);

  useEffect(() => {
    if (!selectedService || !selectedCountry || activeTab === 'rental') { setPricing(null); return; }
    let cancelled = false;
    setPricingLoading(true); setPricing(null);
    const fetchPricing = async () => {
      try {
        const res = await fetch(`/api/pricing?country=${selectedCountry}&service=${selectedService}`);
        if (res.ok && !cancelled) { const data = await res.json(); setPricing(data); }
      } catch { /* silently fail */ }
      finally { if (!cancelled) setPricingLoading(false); }
    };
    fetchPricing();
    return () => { cancelled = true; };
  }, [selectedService, selectedCountry, activeTab]);

  // Countdown timer — always calculates from order's actual expiresAt, never resets
  useEffect(() => {
    if (!orderResult?.expiresAt) { setTimeLeft(null); return; }
    const update = () => setTimeLeft(Math.max(0, Math.floor((new Date(orderResult.expiresAt).getTime() - Date.now()) / 1000)));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [orderResult]);

  const handleOrder = useCallback(async () => {
    if (!selectedService || !selectedCountry) { setStatusMessage('Please select a service and country.'); return; }
    setWorking(true); setStatusMessage('Ordering number...'); setOrderResult(null); setVerificationCode(''); setTimeLeft(null);
    try {
      const endpoint = activeTab === 'voice' ? '/api/verify/voice' : '/api/verify/sms';
      const body: Record<string, string> = { country: selectedCountry, service: selectedService };
      if (activeTab === 'rental') body.plan = selectedPlan;
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setStatusMessage(data.error || 'Failed to order.'); setWorking(false); return; }
      setOrderResult(data.order);
      setStatusMessage(`Number acquired. Use ${data.order.phoneNumber} to receive your code.`);
      if (data.order.expiresAt) { const expiry = new Date(data.order.expiresAt).getTime(); setTimeLeft(Math.max(0, Math.floor((expiry - Date.now()) / 1000))); }
      trackEvent('Verification Ordered', { type: activeTab, service: selectedService, country: selectedCountry, cost: data.order.cost, plan: activeTab === 'rental' ? selectedPlan : undefined });
    } catch { setStatusMessage('An unexpected error occurred.'); }
    finally { setWorking(false); }
  }, [selectedService, selectedCountry, selectedPlan, activeTab]);

  const handleCheckCode = useCallback(async () => {
    if (!orderResult) return;
    setCheckingCode(true); setStatusMessage('Checking for verification code...');
    try {
      const endpoint = activeTab === 'voice' ? '/api/verify/voice' : '/api/verify/sms';
      const res = await fetch(`${endpoint}?orderId=${orderResult.id}`);
      const data = await res.json();
      if (!res.ok) { setStatusMessage(data.error || 'Failed to check code.'); setCheckingCode(false); return; }
      if (data.status === 'completed' && data.code) {
        setVerificationCode(data.code); setStatusMessage('Verification code received!'); setTimeLeft(null);
        trackEvent('Verification Code Received', { type: activeTab, service: orderResult.service, country: orderResult.country });
      } else if (data.status === 'expired' || data.status === 'refunded') {
        setStatusMessage(data.message || 'Order expired. Balance refunded.'); setOrderResult(null); setTimeLeft(null);
      } else { setStatusMessage('Code not yet received. Keep waiting...'); }
    } catch { setStatusMessage('Failed to check for code.'); }
    finally { setCheckingCode(false); }
  }, [orderResult, activeTab]);

  const handleCancelOrder = useCallback(async () => {
    if (!orderResult) return;
    setWorking(true);
    try {
      const endpoint = activeTab === 'voice' ? '/api/verify/voice' : '/api/verify/sms';
      await fetch(`${endpoint}?orderId=${orderResult.id}`, { method: 'DELETE' });
      setOrderResult(null); setVerificationCode(''); setStatusMessage('Order cancelled.'); setTimeLeft(null);
    } catch { setStatusMessage('Failed to cancel order.'); }
    finally { setWorking(false); }
  }, [orderResult, activeTab]);

  const popularServices = services.filter(s => POPULAR_SERVICE_IDS.includes(s.id));
  const otherServices = services.filter(s => !POPULAR_SERVICE_IDS.includes(s.id));
  const popularCountries = countries.filter(c => POPULAR_COUNTRY_CODES.includes(c.id));
  const otherCountries = countries.filter(c => !POPULAR_COUNTRY_CODES.includes(c.id));

  if (loading) return <div className="auth-page"><SpinnerIcon className="spinner--lg spinner--indigo" /></div>;
  if (!user) return null;

  const statusModifier = statusMessage.includes('received') ? 'status-msg--success'
    : statusMessage.includes('error') || statusMessage.includes('failed') ? 'status-msg--error'
    : 'status-msg--info';

  return (
    <div className="dashboard page-container">
      <div className="dashboard__header">
        <h1 className="dashboard__title">Welcome back, {user.username}</h1>
        <p className="dashboard__subtitle">Start a new verification or manage your existing ones.</p>
      </div>
      <div className="stats-grid">
        {[
          { label: 'Balance', value: `$${user.balance.toFixed(2)}`, Icon: WalletIcon },
          { label: 'Total Orders', value: '0', Icon: ClipboardIcon },
          { label: 'Active Rentals', value: '0', Icon: PhoneIcon },
          { label: 'Completed', value: '0', Icon: ChartIcon, color: true },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div className="stat-card__header"><stat.Icon className="icon-md stat-card__icon" /><span className="stat-card__label">{stat.label}</span></div>
            <div className={`stat-card__value ${stat.color ? 'stat-card__value--success' : ''}`}>{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div>
          <div className="dashboard-form-card">
            <h2 className="dashboard-form-card__title">New Verification</h2>
            <div className="verification-tabs">
              {(['sms', 'voice', 'rental'] as const).map(tab => (
                <button key={tab} onClick={() => { setActiveTab(tab); setOrderResult(null); setVerificationCode(''); setTimeLeft(null); }}
                  className={`verification-tab ${activeTab === tab ? 'verification-tab--active' : ''}`}>
                  {tab === 'sms' && <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                  {tab === 'voice' && <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                  {tab === 'rental' && <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                  {tab === 'sms' ? 'SMS' : tab === 'voice' ? 'Voice' : 'Rental'}
                </button>
              ))}
            </div>
            <div className="selector-section">
              <label className="selector-section__label">Select Service{selectedService && <span className="selector-section__detected"> — {services.find(s => s.id === selectedService)?.name}</span>}</label>
              <div className="selector-grid">
                {listsLoading && <div className="selector-empty">Loading...</div>}
                {!listsLoading && popularServices.map(svc => (
                  <button key={svc.id} onClick={() => setSelectedService(svc.id)} className={`selector-btn ${selectedService === svc.id ? 'selector-btn--active' : ''}`}>{svc.name}</button>
                ))}
                {!listsLoading && <button onClick={() => { setServiceSearch(''); setShowAllServices(true); }} className="selector-btn selector-btn--more">+ {otherServices.length} more...</button>}
              </div>
            </div>
            <div className="selector-section">
              <label className="selector-section__label">Select Country{selectedCountry && <span className="selector-section__detected"> — {countries.find(c => c.id === selectedCountry)?.name}</span>}</label>
              <div className="selector-grid">
                {listsLoading && <div className="selector-empty">Loading...</div>}
                {!listsLoading && popularCountries.map(c => (
                  <button key={c.id} onClick={() => setSelectedCountry(c.id)} className={`selector-btn ${selectedCountry === c.id ? 'selector-btn--active' : ''}`}>{c.name}</button>
                ))}
                {!listsLoading && <button onClick={() => { setCountrySearch(''); setShowAllCountries(true); }} className="selector-btn selector-btn--more">+ {otherCountries.length} more...</button>}
              </div>
            </div>
            {activeTab === 'rental' && (
              <div className="selector-section">
                <label className="selector-section__label">Select Plan</label>
                <div className="selector-grid selector-grid--2col">
                  {Object.entries(PLAN_DURATIONS).map(([key, plan]) => (
                    <button key={key} onClick={() => setSelectedPlan(key as PlanTier)} className={`selector-btn ${selectedPlan === key ? 'selector-btn--active' : ''}`}>
                      <div className="selector-plan__label">{plan.label}</div>
                      <div className="selector-plan__days">{plan.days} days</div>
                      {plan.discount > 0 && <div className="selector-plan__discount">-{plan.discount}%</div>}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedService && selectedCountry && activeTab !== 'rental' && (
              <div className="pricing-display">
                {pricingLoading ? <span className="pricing-display__loading">Calculating price...</span>
                  : pricing ? <span className="pricing-display__value">${pricing.displayPrice.toFixed(2)}{pricing.successRate && <span className="pricing-display__rate"> • {pricing.successRate}% success</span>}</span>
                  : <span className="pricing-display__unavailable">Price unavailable</span>}
              </div>
            )}
            <button onClick={handleOrder} disabled={working || !selectedService || !selectedCountry} className="dashboard-submit">
              {working ? 'Processing...' : `Get ${activeTab === 'rental' ? 'Rental' : activeTab === 'voice' ? 'Voice' : 'SMS'} Number`}
            </button>
            {statusMessage && <div className={`status-msg ${statusModifier}`}>{statusMessage}</div>}
            {orderResult && (
              <div className="active-order">
                <h3 className="active-order__title">Active Order{timeLeft !== null && timeLeft > 0 && <span className="active-order__timer"> — {formatTime(timeLeft)} remaining</span>}</h3>
                <div className="active-order__grid">
                  <div>
                    <div className="active-order__field-label">Phone Number</div>
                    <div className="active-order__phone-row">
                      <span className="active-order__phone">{orderResult.phoneNumber}</span>
                      <button onClick={() => handleCopyNumber(orderResult.rawNumber || String(orderResult.phoneNumber))} className="copy-btn" title="Copy Phone Number">
                        {copiedNumber ? <span className="copy-btn__label">Copied!</span> : <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                      </button>
                    </div>
                  </div>
                  <div><div className="active-order__field-label">Cost</div><div className="active-order__cost">${orderResult.cost.toFixed(2)}</div></div>
                </div>
                {verificationCode ? (
                  <div className="code-display">
                    <div><div className="code-display__label">Verification Code</div><div className="code-display__value">{verificationCode}</div></div>
                    <button onClick={() => handleCopyCode(verificationCode)} className="code-display__copy-btn">{copiedCode ? 'Copied!' : 'Copy Code'}</button>
                  </div>
                ) : (
                  <button onClick={handleCheckCode} disabled={checkingCode} className="check-code-btn">
                    {checkingCode ? <span className="check-code-btn__inner"><SpinnerIcon className="icon-md" /> Checking...</span> : 'Check for Code'}
                  </button>
                )}
                <button onClick={handleCancelOrder} disabled={working} className="cancel-btn">Cancel Order</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showAllServices && <PickerModal items={services} search={serviceSearch} onSearchChange={setServiceSearch} selected={selectedService} onSelect={setSelectedService} onClose={() => setShowAllServices(false)} label="All Services" />}
      {showAllCountries && <PickerModal items={countries} search={countrySearch} onSearchChange={setCountrySearch} selected={selectedCountry} onSelect={setSelectedCountry} onClose={() => setShowAllCountries(false)} label="All Countries" />}
    </div>
  );
}