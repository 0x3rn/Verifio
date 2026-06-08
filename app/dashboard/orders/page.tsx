'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SpinnerIcon, ClipboardIcon, ArrowLeftIcon } from '@/components/Icons';
import type { VerificationOrder } from '@/lib/types';
import { SUPPORTED_SERVICES, SUPPORTED_COUNTRIES } from '@/lib/types';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<VerificationOrder[]>([]);
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});
  const [countriesMap, setCountriesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [now, setNow] = useState(Date.now());

  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyNumber = (id: string, num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  useEffect(() => {
    // Timer interval for updating countdowns
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchOrdersAndLists = async () => {
      try {
        const [ordersRes, servicesRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/services')
        ]);

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data.orders || []);
        } else if (ordersRes.status === 401) {
          router.push('/login');
        }

        if (servicesRes.ok) {
          const { services, countries } = await servicesRes.json();
          const sMap: Record<string, string> = {};
          const cMap: Record<string, string> = {};
          
          services?.forEach((s: any) => sMap[String(s.ID)] = s.name);
          countries?.forEach((c: any) => cMap[String(c.ID)] = c.name);
          
          setServicesMap(sMap);
          setCountriesMap(cMap);
        }
      } catch { /* keep existing */ }
      finally { setLoading(false); }
    };
    fetchOrdersAndLists();
  }, [router]);

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter || o.type === filter);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'badge--completed',
      waiting_for_code: 'badge--waiting',
      pending: 'badge--pending',
      expired: 'badge--expired',
      cancelled: 'badge--cancelled',
    };
    return map[status] || 'badge--pending';
  };

  const getServiceName = (id: string) => {
    return servicesMap[id] || SUPPORTED_SERVICES.find(s => s.id === id)?.name || id;
  };

  const getCountryName = (id: string) => {
    return countriesMap[id] || SUPPORTED_COUNTRIES.find(c => c.code === id)?.name || id;
  };

  const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="auth-page">
        <SpinnerIcon className="spinner--lg spinner--indigo" />
      </div>
    );
  }

  return (
    <div className="sub-page page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/dashboard" className="breadcrumb__link">
          <ArrowLeftIcon className="icon-md" /> Back to Dashboard
        </Link>
      </div>

      <div className="sub-page-header">
        <div>
          <h1 className="sub-page-header__title">Order History</h1>
          <p className="sub-page-header__subtitle">View all your verification orders and their codes.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        {[
          { key: 'all', label: 'All' },
          { key: 'completed', label: 'Completed' },
          { key: 'waiting_for_code', label: 'Waiting' },
          { key: 'expired', label: 'Expired' },
          { key: 'cancelled', label: 'Cancelled' },
          { key: 'sms', label: 'SMS' },
          { key: 'voice', label: 'Voice' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`filter-btn ${filter === f.key ? 'filter-btn--active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon-wrapper">
            <ClipboardIcon className="icon-2xl empty-state__icon" />
          </div>
          <h3 className="empty-state__title">No orders found</h3>
          <p className="empty-state__desc">
            {orders.length === 0 ? 'Start by creating your first verification order from the dashboard.' : 'No orders match the selected filter.'}
          </p>
          {orders.length === 0 && (
            <Link href="/dashboard" className="empty-state__cta">Go to Dashboard</Link>
          )}
        </div>
      ) : (
        <div className="card-list">
          {filteredOrders.map((order) => {
            const timeLeft = new Date(order.expiresAt).getTime() - now;
            const isWaiting = order.status === 'waiting_for_code';

            return (
              <div key={order.id} className="list-card">
                <div className="list-card__header">
                  <div>
                    <div className="list-card__service">{getServiceName(order.service)}</div>
                    <div className="list-card__country">{getCountryName(order.country)}</div>
                  </div>
                  <div className="list-card__badges">
                    <span className={`badge ${getStatusBadge(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <span className="badge badge--type">{order.type}</span>
                  </div>
                </div>

                <div className="card-details card-details--4col">
                  <div>
                    <div className="card-detail__label">Phone Number</div>
                    <div className="card-detail__phone-row">
                      <span>{order.phoneNumber}</span>
                      <button
                        onClick={() => handleCopyNumber(order.id, order.phoneNumber)}
                        className="copy-btn"
                        title="Copy Phone Number"
                      >
                        {copiedOrderId === order.id ? (
                          <span className="copy-btn__label">Copied!</span>
                        ) : (
                          <ClipboardIcon className="icon-sm" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="card-detail__label">Cost</div>
                    <div className="card-detail__value">${order.cost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="card-detail__label">Date</div>
                    <div className="card-detail__value">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="card-detail__label">Timer</div>
                    <div className="card-detail__value">
                      {isWaiting ? (
                        <span className="text-red-500 font-mono font-medium">{formatTime(timeLeft)}</span>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                </div>

                {/* Verification code display */}
                {order.status === 'completed' && order.code && (
                  <div className="card-code-section">
                    <div>
                      <div className="card-code-section__label">Verification Code</div>
                      <div className="card-code-section__value">{order.code}</div>
                      {order.completedAt && (
                        <div className="card-code-section__completed">Completed {new Date(order.completedAt).toLocaleString()}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopyCode(order.id, order.code)}
                      className="card-code-section__copy-btn"
                    >
                      {copiedCodeId === order.id ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}