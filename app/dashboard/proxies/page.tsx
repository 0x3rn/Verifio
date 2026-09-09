'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ClipboardIcon, GlobeIcon, SpinnerIcon } from '@/components/Icons';
import type { ProxyAppDetails } from '@/lib/proxyapp';
import type { ProxyOrder, ProxyPackage } from '@/lib/types';

interface CredentialRecord {
  orderId: string;
  proxy: ProxyAppDetails;
  extensionPrice: number | null;
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No expiry set';
}

export default function ProxiesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<ProxyPackage[]>([]);
  const [orders, setOrders] = useState<ProxyOrder[]>([]);
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderingId, setOrderingId] = useState<number | null>(null);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [copied, setCopied] = useState('');

  const loadProxies = useCallback(async () => {
    try {
      const response = await fetch('/api/proxies');
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load proxy plans.');
      setPackages(Array.isArray(data.packages) ? data.packages : []);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setCredentials(Array.isArray(data.credentials) ? data.credentials : []);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load proxy plans.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadProxies(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProxies]);

  const handleOrder = async (packageId: number) => {
    setOrderingId(packageId);
    setError('');
    try {
      const response = await fetch('/api/proxies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to order this proxy plan.');
      await loadProxies();
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : 'Unable to order this proxy plan.');
    } finally {
      setOrderingId(null);
    }
  };

  const handleExtend = async (order: ProxyOrder) => {
    const record = credentials.find((item) => item.orderId === order.id);
    if (!record?.extensionPrice) {
      setError('The current extension price is unavailable. Reload and try again.');
      return;
    }

    const confirmed = window.confirm(`Extend ${order.packageName} for 30 days at $${record.extensionPrice.toFixed(2)}?`);
    if (!confirmed) return;

    setExtendingId(order.id);
    setError('');
    try {
      const response = await fetch('/api/proxies/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to extend this proxy.');
      await loadProxies();
    } catch (extendError) {
      setError(extendError instanceof Error ? extendError.message : 'Unable to extend this proxy.');
    } finally {
      setExtendingId(null);
    }
  };

  const copyValue = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1800);
  };

  if (loading) {
    return <div className="proxies-page proxies-page--loading page-container"><SpinnerIcon className="spinner--lg spinner--indigo" /><span>Loading proxy plans</span></div>;
  }

  return (
    <div className="proxies-page page-container">
      <div className="proxies-page__back-row">
        <Link href="/dashboard" className="orders-back-link"><ArrowLeftIcon className="icon-sm" /> Back to Dashboard</Link>
        <span className="proxies-page__label">NETWORK ACCESS</span>
      </div>

      <header className="proxies-page__header">
        <div>
          <p className="proxies-page__eyebrow">Private routing, clearly managed</p>
          <h1 className="proxies-page__title">Residential proxies</h1>
          <p className="proxies-page__subtitle">Choose a bandwidth package, then keep your proxy credentials and expiry details in one place.</p>
        </div>
        <div className="proxies-page__mark"><GlobeIcon className="icon-lg" /></div>
      </header>

      {error && <div className="proxies-page__error" role="alert">{error}</div>}

      <section className="proxies-section" aria-labelledby="proxy-plans-title">
        <div className="proxies-section__heading">
          <div><p className="orders-section-label">Available plans</p><h2 id="proxy-plans-title">Pick the right amount of bandwidth</h2></div>
          <span>Prices include Verifio service handling.</span>
        </div>
        {packages.length === 0 ? (
          <div className="proxies-empty">Proxy plans are temporarily unavailable. Please try again shortly.</div>
        ) : (
          <div className="proxies-plans">
            {packages.map((proxyPackage) => (
              <article className="proxies-plan" key={proxyPackage.id}>
                <div className="proxies-plan__topline"><span className="proxies-plan__tag">{proxyPackage.name}</span><span>{proxyPackage.lengthDays} days</span></div>
                <strong className="proxies-plan__size">{proxyPackage.bandwidthGb} GB</strong>
                <p className="proxies-plan__rate">${proxyPackage.ratePerGb.toFixed(2)} per GB · HTTP residential access</p>
                <ul className="proxies-plan__features">
                  {proxyPackage.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <p className="proxies-plan__extension">Extendable for {proxyPackage.extensionDays} days at 50% of the provider&apos;s remaining package value.</p>
                <div className="proxies-plan__footer">
                  <strong>${proxyPackage.displayPrice.toFixed(2)} <small>/ month</small></strong>
                  <button type="button" className="dash-btn-primary" disabled={orderingId !== null} onClick={() => handleOrder(proxyPackage.id)}>
                    {orderingId === proxyPackage.id ? 'Ordering…' : 'Get proxy'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="proxies-section" aria-labelledby="active-proxies-title">
        <div className="proxies-section__heading"><div><p className="orders-section-label">Your access</p><h2 id="active-proxies-title">Active proxies</h2></div><span>{orders.length} purchase{orders.length === 1 ? '' : 's'}</span></div>
        {orders.length === 0 ? <div className="proxies-empty">Your purchased proxies will appear here with their connection details.</div> : (
          <div className="proxies-orders">
            {orders.map((order) => {
              const record = credentials.find((item) => item.orderId === order.id);
              const proxy = record?.proxy;
              return (
                <article className="proxies-order" key={order.id}>
                  <div className="proxies-order__header"><div><span className="proxies-order__name">{order.packageName}</span><span className="proxies-order__meta">{order.bandwidthGb} GB · {order.status}</span></div><div className="proxies-order__actions"><span className="proxies-order__date">Expires {formatDate(order.expiresAt)}</span>{order.status === 'active' && proxy && record?.extensionPrice ? <button type="button" className="proxies-order__extend" disabled={extendingId !== null} onClick={() => handleExtend(order)}>{extendingId === order.id ? 'Extending…' : `Extend 30 days · $${record.extensionPrice.toFixed(2)}`}</button> : null}</div></div>
                  {proxy ? (
                    <div className="proxies-credentials">
                      {([['Host', proxy.host], ['Port', proxy.port], ['Username', proxy.username]] as const).map(([label, value]) => (
                        <div className="proxies-credential" key={label}><span>{label}</span><code>{value}</code><button type="button" onClick={() => copyValue(`${order.id}-${label}`, value)}>{copied === `${order.id}-${label}` ? 'Copied' : <ClipboardIcon className="icon-sm" />}</button></div>
                      ))}
                      <details className="proxies-credential proxies-credential--secret"><summary>Password</summary><code>{proxy.password}</code><button type="button" onClick={() => copyValue(`${order.id}-Password`, proxy.password)}>{copied === `${order.id}-Password` ? 'Copied' : <ClipboardIcon className="icon-sm" />}</button></details>
                    </div>
                  ) : <p className="proxies-order__pending">Credentials are being refreshed. Reload in a moment.</p>}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
