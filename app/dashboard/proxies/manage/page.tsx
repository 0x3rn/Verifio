'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ClipboardIcon, GlobeIcon, SpinnerIcon } from '@/components/Icons';
import type { ProxyAppDetails } from '@/lib/proxyapp';
import type { ProxyOrder } from '@/lib/types';

interface CredentialRecord {
  orderId: string;
  proxy: ProxyAppDetails;
  extensionPrice: number | null;
}

function formatDate(value: string | null): string {
  return value
    ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No expiry set';
}

export default function ManageProxiesPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<ProxyOrder[]>([]);
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      if (!response.ok) throw new Error(data.error || 'Unable to load your proxies.');
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setCredentials(Array.isArray(data.credentials) ? data.credentials : []);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your proxies.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadProxies(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProxies]);

  const copyValue = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1800);
  };

  const handleExtend = async (order: ProxyOrder) => {
    const record = credentials.find((item) => item.orderId === order.id);
    if (!record?.extensionPrice) {
      setError('The current extension price is unavailable. Reload and try again.');
      return;
    }

    if (!window.confirm(`Extend ${order.packageName} for 30 days at $${record.extensionPrice.toFixed(2)}?`)) return;

    setExtendingId(order.id);
    setError('');
    try {
      const response = await fetch('/api/proxies/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to extend this proxy.');
      await loadProxies();
    } catch (extendError) {
      setError(extendError instanceof Error ? extendError.message : 'Unable to extend this proxy.');
    } finally {
      setExtendingId(null);
    }
  };

  if (loading) {
    return <div className="proxies-page proxies-page--loading page-container"><SpinnerIcon className="spinner--lg spinner--indigo" /><span>Loading your proxies</span></div>;
  }

  return (
    <div className="proxies-page proxies-manage-page page-container">
      <div className="proxies-page__back-row">
        <Link href="/dashboard/proxies" className="orders-back-link"><ArrowLeftIcon className="icon-sm" /> Back to Proxy Plans</Link>
        <span className="proxies-page__label">MY PROXIES</span>
      </div>

      <header className="proxies-page__header">
        <div>
          <p className="proxies-page__eyebrow">Your active access</p>
          <h1 className="proxies-page__title">Manage proxies</h1>
          <p className="proxies-page__subtitle">View connection details, check expiry dates, and extend active packages.</p>
        </div>
        <div className="proxies-page__mark"><GlobeIcon className="icon-lg" /></div>
      </header>

      {error && <div className="proxies-page__error" role="alert">{error}</div>}

      <section className="proxies-section" aria-labelledby="managed-proxies-title">
        <div className="proxies-section__heading">
          <div><p className="orders-section-label">Connection details</p><h2 id="managed-proxies-title">Your proxies</h2></div>
          <span>{orders.length} {orders.length === 1 ? 'proxy' : 'proxies'}</span>
        </div>

        {orders.length === 0 ? (
          <div className="proxies-empty">
            You do not have any proxy packages yet.
            <Link href="/dashboard/proxies" className="proxies-manage__buy">Browse proxy plans</Link>
          </div>
        ) : (
          <div className="proxies-orders">
            {orders.map((order) => {
              const record = credentials.find((item) => item.orderId === order.id);
              const proxy = record?.proxy;
              const canExtend = order.status === 'active' && Boolean(proxy && record?.extensionPrice);

              return (
                <article className="proxies-order" key={order.id}>
                  <div className="proxies-order__header">
                    <div>
                      <span className="proxies-order__name">{order.packageName}</span>
                      <span className="proxies-order__meta">{order.bandwidthGb} GB · {order.status}</span>
                    </div>
                    <div className="proxies-order__actions">
                      <span className="proxies-order__date">Expires {formatDate(order.expiresAt)}</span>
                      {canExtend && (
                        <button type="button" className="proxies-order__extend" disabled={extendingId !== null} onClick={() => handleExtend(order)}>
                          {extendingId === order.id ? 'Extending…' : `Extend 30 days · $${record?.extensionPrice?.toFixed(2)}`}
                        </button>
                      )}
                    </div>
                  </div>

                  {proxy ? (
                    <div className="proxies-credentials">
                      {([['Host', proxy.host], ['Port', proxy.port], ['Username', proxy.username]] as const).map(([label, value]) => (
                        <div className="proxies-credential" key={label}>
                          <span>{label}</span><code>{value}</code>
                          <button type="button" aria-label={`Copy ${label}`} onClick={() => copyValue(`${order.id}-${label}`, value)}>
                            {copied === `${order.id}-${label}` ? 'Copied' : <ClipboardIcon className="icon-sm" />}
                          </button>
                        </div>
                      ))}
                      <details className="proxies-credential proxies-credential--secret">
                        <summary>Password</summary><code>{proxy.password}</code>
                        <button type="button" aria-label="Copy Password" onClick={() => copyValue(`${order.id}-Password`, proxy.password)}>
                          {copied === `${order.id}-Password` ? 'Copied' : <ClipboardIcon className="icon-sm" />}
                        </button>
                      </details>
                    </div>
                  ) : (
                    <p className="proxies-order__pending">Connection details are still syncing. Reload in a moment.</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
