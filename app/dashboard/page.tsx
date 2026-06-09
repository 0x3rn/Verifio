'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SpinnerIcon, ClipboardIcon, WalletIcon, CheckIcon } from '@/components/Icons';
import { Combobox } from '@/components/Combobox';
import { SUPPORTED_SERVICES, SUPPORTED_COUNTRIES, PLAN_DURATIONS } from '@/lib/types';
import type { User, PlanTier, VerificationOrder } from '@/lib/types';
import { identifyUser, trackEvent } from '@/lib/posthog';

interface SelectableItem {
  id: string;
  name: string;
}

const POPULAR_SERVICE_NAMES = ['google', 'whatsapp', 'telegram', 'discord', 'facebook', 'instagram', 'twitter', 'microsoft'];
const POPULAR_COUNTRY_NAMES = ['united states', 'united kingdom', 'canada', 'australia', 'germany', 'france', 'netherlands', 'sweden'];

function formatTime(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  const [activeOrders, setActiveOrders] = useState<VerificationOrder[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [working, setWorking] = useState(false);
  
  const [serviceSearch, setServiceSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  
  const [pricing, setPricing] = useState<{ basePrice: number; displayPrice: number; successRate?: number } | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  
  const [now, setNow] = useState(Date.now());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkingOrderId, setCheckingOrderId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const fetchUserAndOrders = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) { 
          const data = await userRes.json(); 
          setUser(data.user); 
        } else { 
          router.push('/login'); 
          return;
        }

        const ordersRes = await fetch('/api/orders');
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          const active = (data.orders || []).filter((o: VerificationOrder) => o.status === 'waiting_for_code');
          setActiveOrders(active);
        }
      } catch { 
        router.push('/login'); 
      }
      finally { setLoading(false); }
    };
    fetchUserAndOrders();
  }, [router]);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.services)) setServices(data.services.map((s: { ID: number; name: string }) => ({ id: String(s.ID), name: s.name })));
          if (Array.isArray(data.countries)) setCountries(data.countries.map((c: { ID: number; code: string; name: string; short_name: string }) => ({ id: String(c.ID), name: c.name })));
        }
      } catch { /* fallback */ }
      finally { setListsLoading(false); }
    };
    fetchLists();
  }, []);

  useEffect(() => { 
    if (user && !hasIdentified) { 
      identifyUser(user.id, { username: user.username, email: user.email || undefined }); 
      setHasIdentified(true); 
    } 
  }, [user, hasIdentified]);

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

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    try {
      await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      setActiveOrders(prev => prev.filter(o => o.id !== orderId));
      
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const data = await userRes.json();
        setUser(data.user);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    activeOrders.forEach(order => {
      const timeLeft = new Date(order.expiresAt).getTime() - now;
      if (timeLeft <= 0) {
        handleCancelOrder(order.id);
      }
    });
  }, [now, activeOrders, handleCancelOrder]);

  const handleOrder = useCallback(async () => {
    if (!selectedService || !selectedCountry) { setStatusMessage('Please select a service and country.'); return; }
    if (activeOrders.length >= 5) { setStatusMessage('Limit of 5 active orders reached.'); return; }

    setWorking(true); setStatusMessage('Ordering number...'); 
    try {
      const endpoint = activeTab === 'voice' ? '/api/verify/voice' : '/api/verify/sms';
      const body: Record<string, string> = { country: selectedCountry, service: selectedService };
      if (activeTab === 'rental') body.plan = selectedPlan;
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setStatusMessage(data.error || 'Failed to order.'); setWorking(false); return; }
      
      setActiveOrders(prev => [data.order, ...prev]);
      setStatusMessage(`Number acquired.`);
      trackEvent('Verification Ordered', { type: activeTab, service: selectedService, country: selectedCountry, cost: data.order.cost, plan: activeTab === 'rental' ? selectedPlan : undefined });
      
      setUser(prev => prev ? { ...prev, balance: prev.balance - data.order.cost } : prev);
    } catch { setStatusMessage('An unexpected error occurred.'); }
    finally { setWorking(false); }
  }, [selectedService, selectedCountry, selectedPlan, activeTab, activeOrders.length]);

  const handleCheckCode = useCallback(async (orderId: string) => {
    const order = activeOrders.find(o => o.id === orderId);
    if (!order) return;

    setCheckingOrderId(orderId); setStatusMessage('Checking code...');
    try {
      const endpoint = order.type === 'voice' ? '/api/verify/voice' : '/api/verify/sms';
      const res = await fetch(`${endpoint}?orderId=${orderId}`);
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
        
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data.user);
        }
      } else { 
        setStatusMessage('Code not yet received. Keep waiting...'); 
      }
    } catch { setStatusMessage('Failed to check for code.'); }
    finally { setCheckingOrderId(null); }
  }, [activeOrders]);

  const handleManualCancel = async (orderId: string) => {
    setWorking(true);
    await handleCancelOrder(orderId);
    setWorking(false);
    setStatusMessage('Order cancelled and refunded.');
  };

  const filteredServices = useMemo(() => {
    return services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase())).sort((a, b) => {
      const aPop = POPULAR_SERVICE_NAMES.includes(a.name.toLowerCase());
      const bPop = POPULAR_SERVICE_NAMES.includes(b.name.toLowerCase());
      if (aPop && !bPop) return -1;
      if (!aPop && bPop) return 1;
      return 0;
    });
  }, [services, serviceSearch]);

  const filteredCountries = useMemo(() => {
    return countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).sort((a, b) => {
      const aPop = POPULAR_COUNTRY_NAMES.includes(a.name.toLowerCase());
      const bPop = POPULAR_COUNTRY_NAMES.includes(b.name.toLowerCase());
      if (aPop && !bPop) return -1;
      if (!aPop && bPop) return 1;
      return 0;
    });
  }, [countries, countrySearch]);

  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || id;
  const getCountryName = (id: string) => countries.find(c => c.id === id)?.name || id;

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SpinnerIcon className="w-8 h-8 text-indigo-500 animate-spin" />
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
          <p className="dash-header__subtitle">Manage your verifications.</p>
        </div>
        <div className="dash-header__balance">
          <WalletIcon className="icon-sm text-gray-400" />
          <span>${user.balance.toFixed(2)}</span>
          <Link href="/dashboard/billing">
            <button className="dash-topup-btn">Top Up</button>
          </Link>
        </div>
      </header>

      <div className="dash-grid">
        {/* Left Panel: Create Verification */}
        <div className="dash-panel">
          <div className="dash-panel__header">
            <h2 className="dash-panel__title">Create Verification</h2>
          </div>
          
          <div className="dash-panel__content">
            {/* Segmented Control */}
            <div className="segmented-control">
              {(['sms', 'voice', 'rental'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`segmented-control__btn ${activeTab === tab ? 'segmented-control__btn--active' : ''}`}
                >
                  {tab === 'sms' ? 'SMS' : tab === 'voice' ? 'Voice' : 'Rental'}
                </button>
              ))}
            </div>

            {/* Selectors */}
            <div className="dash-selectors">
              <Combobox
                label="Service"
                items={filteredServices}
                selectedId={selectedService}
                onSelect={setSelectedService}
                placeholder="Select a service..."
                loading={listsLoading}
              />

              <Combobox
                label="Country"
                items={filteredCountries}
                selectedId={selectedCountry}
                onSelect={setSelectedCountry}
                placeholder="Select a country..."
                loading={listsLoading}
              />
            </div>

            {activeTab === 'rental' && (
              <div className="dash-selector mt-2">
                <label className="dash-label">Rental Duration</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(PLAN_DURATIONS).map(([key, plan]) => (
                    <button 
                      key={key} 
                      onClick={() => setSelectedPlan(key as PlanTier)} 
                      className={`p-2 border rounded-lg text-sm transition-colors text-center ${selectedPlan === key ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      <div className="block">{plan.label}</div>
                      <div className="text-xs opacity-70">{plan.days} days</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing & Submit */}
            <div className="dash-submit-area">
              <div className="dash-price">
                <span className="dash-price__label">Total Cost</span>
                {pricingLoading ? (
                  <span className="text-sm font-medium text-gray-500 mt-1">Calculating...</span>
                ) : pricing && activeTab !== 'rental' ? (
                  <>
                    <span className="dash-price__value">${pricing.displayPrice.toFixed(2)}</span>
                    {pricing.successRate && <span className="dash-price__success">{pricing.successRate}% success rate</span>}
                  </>
                ) : (
                  <span className="dash-price__value">—</span>
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
            {activeOrders.length >= 5 && <p className="text-red-500 text-xs font-medium text-right mt-[-10px]">Limit of 5 active orders reached.</p>}
            {statusMessage && <div className={`dash-status ${statusModifier}`}>{statusMessage}</div>}
          </div>
        </div>

        {/* Right Panel: Active Verifications */}
        <div className="dash-panel dash-panel--transparent">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Verifications</h2>
            <Link href="/dashboard/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">View History &rarr;</Link>
          </div>
          
          <div className="active-orders-column">
            {activeOrders.length > 0 ? (
              <div className="active-orders-list">
                {activeOrders.map(order => {
                  const timeLeft = new Date(order.expiresAt).getTime() - now;
                  return (
                    <div key={order.id} className="relative bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow mb-4">
                      {/* Accent top border */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-xl opacity-80" />
                      
                      <div className="flex justify-between items-start mb-4 mt-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{getServiceName(order.service)}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-gray-100 dark:bg-gray-800 text-gray-500">{order.type}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{getCountryName(order.country)}</p>
                        </div>
                        {timeLeft > 0 && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-mono font-medium tracking-tight">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            {formatTime(timeLeft)}
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-4 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Phone Number</span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">${order.cost.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-mono font-bold tracking-widest text-gray-900 dark:text-white">{order.phoneNumber}</span>
                          <button onClick={() => handleCopy(order.id, order.phoneNumber)} className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm transition-all hover:border-indigo-200">
                            {copiedId === order.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleCheckCode(order.id)} 
                          disabled={checkingOrderId === order.id} 
                          className="flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold text-sm rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                        >
                          {checkingOrderId === order.id ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : null}
                          {checkingOrderId === order.id ? 'Checking...' : 'Check SMS'}
                        </button>
                        <button 
                          onClick={() => handleManualCancel(order.id)} 
                          disabled={working} 
                          className="flex items-center justify-center py-2 px-3 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-medium text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
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
                <ClipboardIcon className="w-10 h-10 active-order-empty__icon" />
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">No active verifications</h3>
                <p className="text-sm">Create a new verification on the left to get started.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}