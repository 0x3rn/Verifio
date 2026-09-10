'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ClipboardIcon, GlobeIcon, SpinnerIcon } from '@/components/Icons';
import type { ProxyAppDetails, ProxyBlocklistResult } from '@/lib/proxyapp';
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
  const [blocklistUrl, setBlocklistUrl] = useState('');
  const [blocklistResult, setBlocklistResult] = useState<ProxyBlocklistResult | null>(null);
  const [blocklistError, setBlocklistError] = useState('');
  const [checkingBlocklist, setCheckingBlocklist] = useState(false);

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

  const handleBlocklistCheck = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCheckingBlocklist(true);
    setBlocklistError('');
    setBlocklistResult(null);
    try {
      const response = await fetch('/api/proxies/blocklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: blocklistUrl }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      if (!response.ok) throw new Error(data.error || 'Unable to check this domain.');
      if (typeof data.blocked !== 'boolean' || typeof data.domain !== 'string') throw new Error('The blacklist service returned an invalid response.');
      setBlocklistResult(data as ProxyBlocklistResult);
    } catch (checkError) {
      setBlocklistError(checkError instanceof Error ? checkError.message : 'Unable to check this domain.');
    } finally {
      setCheckingBlocklist(false);
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
          <span className="proxies-page__label">PROXY SERVICE</span>
      </div>

      <header className="proxies-page__header">
        <div>
          <p className="proxies-page__eyebrow">Residential access, on demand</p>
          <h1 className="proxies-page__title">Residential proxies</h1>
          <p className="proxies-page__subtitle">Choose the bandwidth you need and get connected with a residential IP.</p>
        </div>
        <Link href="/dashboard/proxies/manage" className="proxies-page__manage-link"><GlobeIcon className="icon-sm" /> Manage your proxies <span aria-hidden="true">↗</span></Link>
      </header>

      {error && <div className="proxies-page__error" role="alert">{error}</div>}

      <section className="proxies-blocklist" aria-labelledby="proxy-blocklist-title">
        <div className="proxies-blocklist__heading">
          <div>
            <p className="proxies-page__eyebrow">Before you buy</p>
            <h2 id="proxy-blocklist-title">Blacklist Check</h2>
          </div>
          <span>Check a domain before ordering</span>
        </div>
        <form className="proxies-blocklist__form" onSubmit={handleBlocklistCheck}>
          <label htmlFor="proxy-blocklist-url">URL or domain</label>
          <div className="proxies-blocklist__controls">
            <input
              id="proxy-blocklist-url"
              type="text"
              inputMode="url"
              autoComplete="url"
              value={blocklistUrl}
              onChange={(event) => {
                setBlocklistUrl(event.target.value);
                setBlocklistResult(null);
                setBlocklistError('');
              }}
              placeholder="example.com or https://example.com"
              aria-describedby="proxy-blocklist-help"
              required
            />
            <button type="submit" className="dash-btn-primary" disabled={checkingBlocklist}>
              {checkingBlocklist ? <><SpinnerIcon className="icon-sm" /> Checking…</> : 'Check'}
            </button>
          </div>
          <p id="proxy-blocklist-help">Check whether a domain is currently blocked on the provider network. This does not purchase a proxy.</p>
          {blocklistError && <p className="proxies-blocklist__status proxies-blocklist__status--error" role="alert">{blocklistError}</p>}
          {blocklistResult && !blocklistError && (
            <div className={`proxies-blocklist__status ${blocklistResult.blocked ? 'proxies-blocklist__status--blocked' : 'proxies-blocklist__status--clear'}`} role="status" aria-live="polite">
              <strong>{blocklistResult.blocked ? 'Blocked' : 'Clear'}</strong>
              <span>{blocklistResult.blocked ? 'This target is currently listed on the provider network blocklist.' : 'This target is not currently listed on the provider network blocklist.'}</span>
              {blocklistResult.matchedRule && <small>Matched rule: {blocklistResult.matchedRule}</small>}
            </div>
          )}
        </form>
      </section>

      <section className="proxies-section" aria-labelledby="proxy-plans-title">
        <div className="proxies-section__heading">
          <div><p className="orders-section-label">Available plans</p><h2 id="proxy-plans-title">Choose your bandwidth plan</h2></div>
          <span>Verifio pricing, shown upfront.</span>
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
                <p className="proxies-plan__extension">Extend for {proxyPackage.extensionDays} days at 50% of this plan&apos;s price.</p>
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
        {orders.length === 0 ? <div className="proxies-empty">Your active proxy details will appear here after you place an order.</div> : (
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
