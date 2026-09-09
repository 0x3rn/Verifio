'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { SpinnerIcon, ClipboardIcon, WalletIcon, CheckIcon, RefreshIcon } from '@/components/Icons';
import { Combobox } from '@/components/Combobox';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { SUPPORTED_SERVICES, SUPPORTED_COUNTRIES, PLAN_DURATIONS } from '@/lib/types';
import type { User, PlanTier, VerificationOrder } from '@/lib/types';
import { identifyUser, trackEvent } from '@/lib/posthog';

interface SelectableItem {
  id: string;
  name: string;
  code?: string;
}

type VerificationProvider = 'smspool' | 'textverified';

function formatTime(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded: isAuthLoaded, getToken } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const hasIdentified = useRef(false);
  const [activeTab, setActiveTab] = useState<'sms' | 'proxy' | 'rental'>('sms');
  const [selectedProvider, setSelectedProvider] = useState<VerificationProvider>('smspool');
  const [selectedService, setSelectedService] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [services, setServices] = useState<SelectableItem[]>(SUPPORTED_SERVICES);
  const [countries, setCountries] = useState<SelectableItem[]>(SUPPORTED_COUNTRIES.map(c => ({ id: c.code, name: c.name, code: c.code })));
  const [textVerifiedServices, setTextVerifiedServices] = useState<string[]>([]);
  const [textVerifiedConfigured, setTextVerifiedConfigured] = useState(false);
  const [listsLoading, setListsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('monthly');

  const [activeOrders, setActiveOrders] = useState<VerificationOrder[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [working, setWorking] = useState(false);
  
  const [pricing, setPricing] = useState<{ basePrice: number; displayPrice: number; successRate?: number } | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  
  const [now, setNow] = useState(() => Date.now());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkingOrderId, setCheckingOrderId] = useState<string | null>(null);

  const authenticatedFetch = useCallback(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const token = await getToken();
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  }, [getToken]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    if (!isAuthLoaded) return;

    let cancelled = false;
    const fetchUserAndOrders = async () => {
      try {
        // A lost network connection must not be treated as an intentional sign-out.
        // The server's 401 is the only state that should send a user to /login.
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) { 
          const data = await userRes.json(); 
          if (!cancelled) {
            setUser(data.user);
            setLoadError('');
          }
        } else { 
          if (userRes.status === 401) {
            router.replace('/login');
          } else if (!cancelled) {
            setLoadError('We could not confirm your account. Check your connection and try again.');
          }
          return;
        }

        const ordersRes = await authenticatedFetch('/api/orders');
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          const active = (data.orders || []).filter((o: VerificationOrder) => o.status === 'waiting_for_code');
          if (!cancelled) setActiveOrders(active);
        }
      } catch {
        if (!cancelled) setLoadError('Your connection was interrupted. Your session was kept—reconnect and try again.');
      }
      finally { if (!cancelled) setLoading(false); }
    };
    fetchUserAndOrders();
    return () => { cancelled = true; };
  }, [authenticatedFetch, isAuthLoaded, router]);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.services)) setServices(data.services.map((s: { ID: number; name: string }) => ({ id: String(s.ID), name: s.name })));
          if (Array.isArray(data.countries)) setCountries(data.countries.map((c: { ID: number; name: string; short_name: string }) => ({ id: String(c.ID), name: c.name, code: c.short_name })));
          if (data.providers?.textverified) {
            setTextVerifiedConfigured(Boolean(data.providers.textverified.configured));
            setTextVerifiedServices(Array.isArray(data.providers.textverified.services) ? data.providers.textverified.services : []);
          }
        }
      } catch { /* fallback */ }
      finally { setListsLoading(false); }
    };
    fetchLists();
  }, []);

  useEffect(() => { 
    if (user && !hasIdentified.current) {
      identifyUser(user.id, { username: user.username, email: user.email || undefined }); 
      hasIdentified.current = true;
    } 
  }, [user]);

  useEffect(() => {
    if (!selectedService || !selectedCountry || activeTab !== 'sms') return;
    let cancelled = false;
    const fetchPricing = async () => {
      setPricingLoading(true);
      setPricing(null);
      try {
        const res = await authenticatedFetch(`/api/pricing?country=${selectedCountry}&service=${selectedService}&provider=${selectedProvider}`);
        if (res.ok && !cancelled) { const data = await res.json(); setPricing(data); }
      } catch { /* silently fail */ }
      finally { if (!cancelled) setPricingLoading(false); }
    };
    fetchPricing();
    return () => { cancelled = true; };
  }, [authenticatedFetch, selectedService, selectedCountry, selectedProvider, activeTab]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    try {
      await authenticatedFetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      setActiveOrders(prev => prev.filter(o => o.id !== orderId));
      setStatusMessage('');
      
      const userRes = await authenticatedFetch('/api/auth/me');
      if (userRes.ok) {
        const data = await userRes.json();
        setUser(data.user);
      }
    } catch { /* ignore */ }
  }, [authenticatedFetch]);

  useEffect(() => {
    activeOrders.forEach(order => {
      const timeLeft = new Date(order.expiresAt).getTime() - now;
      if (timeLeft <= 0) {
        handleCancelOrder(order.id);
      }
    });
  }, [now, activeOrders, handleCancelOrder]);

  const handleOrder = useCallback(async () => {
    if (activeTab === 'proxy') {
      router.push('/dashboard/proxies');
      return;
    }
    if (!selectedService || !selectedCountry) { setStatusMessage('Please select a service and country.'); return; }
    if (activeOrders.length >= 5) { setStatusMessage('Limit of 5 active orders reached.'); return; }

    setWorking(true); setStatusMessage('Ordering number...'); 
    try {
      const endpoint = activeTab === 'rental' ? '/api/rentals' : '/api/verify/sms';
      const body: Record<string, string> = { country: selectedCountry, service: selectedService };
      if (activeTab === 'rental') body.plan = selectedPlan;
      if (activeTab === 'sms') body.provider = selectedProvider;
      const res = await authenticatedFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setStatusMessage(data.error || 'Failed to order.'); setWorking(false); return; }
      
      if (activeTab === 'rental') {
        setStatusMessage('Rental activated. Opening your rentals…');
        router.push('/dashboard/rentals');
        return;
      }
      setActiveOrders(prev => [data.order, ...prev]);
      setStatusMessage('Number acquired.');
      trackEvent('Verification Ordered', { type: activeTab, service: selectedService, country: selectedCountry, cost: data.order.cost });
      
      setUser(prev => prev ? { ...prev, balance: prev.balance - data.order.cost } : prev);
    } catch { setStatusMessage('An unexpected error occurred.'); }
    finally { setWorking(false); }
  }, [authenticatedFetch, selectedService, selectedCountry, selectedPlan, selectedProvider, activeTab, activeOrders.length, router]);

  const handleCheckCode = useCallback(async (orderId: string) => {
    const order = activeOrders.find(o => o.id === orderId);
    if (!order) return;

    setCheckingOrderId(orderId); setStatusMessage('Checking code...');
    try {
      const endpoint = '/api/verify/sms';
      const res = await authenticatedFetch(`${endpoint}?orderId=${orderId}`);
      const data = await res.json();
      
      if (!res.ok) { 
        setStatusMessage(data.error || 'Failed to check code.'); 
        setCheckingOrderId(null); 
        return; 
      }
      
      if (data.status === 'completed' && data.code) {
        setStatusMessage(`Code received: ${data.code}`);
        setActiveOrders(prev => prev.filter(o => o.id !== orderId));
        trackEvent('Verification Code Received', { type: order.type, service: order.service, country: order.country });
      } else if (data.status === 'expired' || data.status === 'cancelled' || data.status === 'refunded') {
        setStatusMessage(data.message || 'Order ended. Balance refunded.'); 
        setActiveOrders(prev => prev.filter(o => o.id !== orderId));
        
        const userRes = await authenticatedFetch('/api/auth/me');
        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data.user);
        }
      } else { 
        setStatusMessage('Code not yet received. Keep waiting...'); 
      }
    } catch { setStatusMessage('Failed to check for code.'); }
    finally { setCheckingOrderId(null); }
  }, [activeOrders, authenticatedFetch]);

  const handleManualCancel = async (orderId: string) => {
    setWorking(true);
    await handleCancelOrder(orderId);
    setWorking(false);
    setStatusMessage('Order cancelled and refunded.');
  };

  const filteredServices = useMemo(() => {
    return [...services].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [services]);

  const filteredCountries = useMemo(() => {
    return [...countries].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [countries]);

  const selectedServiceName = services.find(service => service.id === selectedService)?.name || '';
  const selectedCountryCode = countries.find(country => country.id === selectedCountry)?.code?.toUpperCase() || '';
  const textVerifiedAvailable = Boolean(
    selectedServiceName
    && selectedCountryCode === 'US'
    && textVerifiedConfigured
    && textVerifiedServices.some(name => name.toLowerCase() === selectedServiceName.toLowerCase()),
  );
  const providerOptions = [
    {
      id: 'smspool' as const,
      name: 'SMSPool',
      description: 'Global SMS inventory',
      available: Boolean(selectedService && selectedCountry),
    },
    {
      id: 'textverified' as const,
      name: 'Text Verified',
      description: 'US mobile numbers',
      available: textVerifiedAvailable,
    },
  ];

  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || id;
  const getCountryName = (id: string) => countries.find(c => c.id === id)?.name || id;

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <div className="dash-layout">
        <div className="dash-load-state" role="status">
          <p className="dash-console__section-label">Connection status</p>
          <h1>Dashboard temporarily unavailable</h1>
          <p>{loadError || 'We could not load your account details. Try again when your connection is back.'}</p>
          <button type="button" className="dash-btn-primary" onClick={() => window.location.reload()}>Try again</button>
        </div>
      </div>
    );
  }

  const statusModifier = statusMessage.includes('received') ? 'bg-green-50 text-green-700 border-green-200'
    : statusMessage.includes('error') || statusMessage.includes('failed') ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-indigo-50 text-indigo-700 border-indigo-200';

  return (
    <div className="dash-layout">
      {/* Header */}
      <header className="dash-header">
        <div>
          <h1 className="dash-header__title">Dashboard</h1>
          <p className="dash-header__subtitle">Manage verifications, proxies, and rentals.</p>
        </div>
        <div className="dash-header__balance">
          <WalletIcon className="icon-sm dash-header__balance-icon" />
          <span>${user.balance.toFixed(2)}</span>
          <Link href="/dashboard/billing" className="dash-topup-btn">Top Up</Link>
        </div>
      </header>

      <div className="dash-grid">
        {/* Left Panel: Create Verification */}
        <div className="dash-panel dash-verification-console">
          <div className="dash-panel__header dash-panel__header--console">
            <h2 className="dash-panel__title">Create Verification</h2>
          </div>
          
          <div className="dash-panel__content dash-panel__content--console">
            {/* Segmented Control */}
            <p className="dash-console__section-label">Select your verification path</p>
            <div className="segmented-control">
              {(['sms', 'proxy', 'rental'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`segmented-control__btn ${activeTab === tab ? 'segmented-control__btn--active' : ''}`}
                >
                  {tab === 'sms' ? 'SMS' : tab === 'proxy' ? 'Proxy' : 'Rental'}
                </button>
              ))}
            </div>

            {activeTab === 'proxy' ? (
              <div className="dash-proxy-callout">
                <p className="dash-console__section-label">Residential proxies</p>
                <h3>Keep your connection private.</h3>
                <p>Choose a package with global residential coverage, then manage your proxy credentials and bandwidth from one place.</p>
                <Link href="/dashboard/proxies" className="dash-btn-primary">Browse proxy plans <span aria-hidden="true">↗</span></Link>
              </div>
            ) : (
              <>
                {/* Selectors */}
                <div className="dash-selectors dash-console__choices">
                  <Combobox
                    label="Service"
                    items={filteredServices}
                    selectedId={selectedService}
                    onSelect={(id) => { setSelectedService(id); setSelectedProvider('smspool'); }}
                    placeholder="Select a service..."
                    loading={listsLoading}
                  />

                  <Combobox
                    label="Country"
                    items={filteredCountries}
                    selectedId={selectedCountry}
                    onSelect={(id) => { setSelectedCountry(id); setSelectedProvider('smspool'); }}
                    placeholder="Select a country..."
                    loading={listsLoading}
                    showFlags
                  />
                </div>

                {activeTab === 'sms' && (
                  <div className="dash-selector dash-provider-selector">
                    <label className="dash-label">Number provider</label>
                    <div className="dash-provider-options" role="radiogroup" aria-label="Number provider">
                      {providerOptions.map(option => (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={selectedProvider === option.id}
                          disabled={!option.available}
                          onClick={() => setSelectedProvider(option.id)}
                          className={`dash-provider-option ${selectedProvider === option.id ? 'dash-provider-option--active' : ''}`}
                        >
                          <span className="dash-provider-option__copy">
                            <strong>{option.name}</strong>
                            <small>{option.available ? option.description : 'Unavailable for this selection'}</small>
                          </span>
                          <span className="dash-provider-option__state" aria-hidden="true">{option.available ? (selectedProvider === option.id ? '✓' : '') : '—'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'rental' && (
                  <div className="dash-selector mt-2">
                    <label className="dash-label">Rental Duration</label>
                    <div className="rental-duration-grid">
                      {Object.entries(PLAN_DURATIONS).map(([key, plan]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedPlan(key as PlanTier)}
                          className={`rental-duration-btn ${selectedPlan === key ? 'rental-duration-btn--active' : ''}`}
                          aria-pressed={selectedPlan === key}
                        >
                          <span className="rental-duration-btn__topline">
                            <span className="rental-duration-btn__label">{plan.label}</span>
                            <span className="rental-duration-btn__marker" aria-hidden="true">{selectedPlan === key ? '✓' : ''}</span>
                          </span>
                          <span className="rental-duration-btn__days">{plan.days} days</span>
                          <span className="rental-duration-btn__discount">{plan.discount ? `${plan.discount}% off` : 'Standard rate'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing & Submit */}
                <div className="dash-submit-area dash-console__submit">
                  <div className="dash-price">
                    <span className="dash-price__label">Total Cost</span>
                    {activeTab === 'rental' ? (
                      <span className="dash-price__value dash-price__value--estimate">Quoted after selection</span>
                    ) : pricingLoading ? (
                      <span className="dash-price__loading">Calculating...</span>
                    ) : pricing ? (
                      <>
                        <span className="dash-price__value">${pricing.displayPrice.toFixed(2)}</span>
                        {pricing.successRate && <span className="dash-price__success">{pricing.successRate}% success rate</span>}
                      </>
                    ) : (
                      <span className="dash-price__value">-</span>
                    )}
                  </div>
                  <button
                    onClick={handleOrder}
                    disabled={working || !selectedService || !selectedCountry || activeOrders.length >= 5}
                    className="dash-btn-primary"
                  >
                    {working ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : null}
                    {working ? 'Processing' : `Get Number`}
                  </button>
                </div>
                {activeOrders.length >= 5 && <p className="dash-limit-notice">Limit of 5 active orders reached.</p>}
              </>
            )}
            {statusMessage && <div className={`dash-status ${statusModifier}`}>{statusMessage}</div>}
          </div>
        </div>

        {/* Right Panel: Active Verifications */}
        <div className="dash-panel dash-panel--transparent dash-active-console">
          <div className="dash-panel-heading">
            <h2>Active Verifications</h2>
            <Link href="/dashboard/orders">View history</Link>
          </div>
          
          <div className="active-orders-column">
            {activeOrders.length > 0 ? (
              <div className="active-orders-list">
                {activeOrders.map(order => {
                  const timeLeft = new Date(order.expiresAt).getTime() - now;
                  return (
                    <div key={order.id} className="dash-active-card">
                      <div className="dash-active-card__header">
                        <div>
                          <div className="dash-active-card__service">
                            {getServiceName(order.service)}
                            <span className="dash-active-card__badge">{order.type}</span>
                          </div>
                          <div className="dash-active-card__country">{getCountryName(order.country)}</div>
                        </div>
                        {timeLeft > 0 && (
                          <div className="dash-active-card__timer-wrap">
                            <span className="dash-pulse-dot" />
                            {formatTime(timeLeft)}
                          </div>
                        )}
                      </div>

                      <div className="dash-active-card__body">
                        <div className="dash-active-card__row" style={{ marginBottom: '0.375rem' }}>
                          <span className="dash-active-card__label">Phone Number</span>
                          <span className="dash-active-card__cost">${order.cost.toFixed(2)}</span>
                        </div>
                        <div className="dash-active-card__number-wrap">
                          <span className="dash-active-card__number">{order.phoneNumber}</span>
                          <button onClick={() => handleCopy(order.id, order.phoneNumber)} className="dash-copy-btn">
                            {copiedId === order.id ? <span style={{ color: '#22c55e', display: 'flex' }}><CheckIcon className="icon-sm" /></span> : <ClipboardIcon className="icon-sm" />}
                          </button>
                        </div>
                      </div>

                      <div className="dash-active-card__actions">
                        <button 
                          onClick={() => handleCheckCode(order.id)} 
                          disabled={checkingOrderId === order.id} 
                          className="dash-btn-secondary"
                        >
                          {checkingOrderId === order.id ? <SpinnerIcon className="icon-sm animate-spin" /> : <RefreshIcon className="icon-sm" />}
                          {checkingOrderId === order.id ? 'Checking...' : 'Check SMS'}
                        </button>
                        <button 
                          onClick={() => handleManualCancel(order.id)} 
                          disabled={working} 
                          className="dash-btn-danger"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="active-order-empty">
                <ClipboardIcon className="active-order-empty__icon" />
                <h3>No active verifications</h3>
                <p>Create a new verification on the left to get started.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
