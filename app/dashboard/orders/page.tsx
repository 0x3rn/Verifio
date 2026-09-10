'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CheckCircleIcon, ClipboardIcon, ClockIcon, SpinnerIcon } from '@/components/Icons';
import type { VerificationOrder } from '@/lib/types';
import { PROVIDER_DISPLAY_NAMES, SUPPORTED_SERVICES, SUPPORTED_COUNTRIES } from '@/lib/types';

interface CountryMeta {
  name: string;
  code?: string;
}

type FilterKey = 'all' | 'completed' | 'waiting_for_code' | 'expired' | 'cancelled' | 'sms' | 'smspool' | 'textverified';

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All orders' },
  { key: 'completed', label: 'Completed' },
  { key: 'waiting_for_code', label: 'Waiting' },
  { key: 'expired', label: 'Expired' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'sms', label: 'SMS' },
  { key: 'smspool', label: PROVIDER_DISPLAY_NAMES.smspool },
  { key: 'textverified', label: PROVIDER_DISPLAY_NAMES.textverified },
];

function formatTime(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatStatus(status: VerificationOrder['status']): string {
  return status.replace(/_/g, ' ');
}

function getStatusDescription(status: VerificationOrder['status']): string {
  switch (status) {
    case 'completed':
      return 'Verification completed';
    case 'waiting_for_code':
      return 'Waiting for incoming code';
    case 'expired':
      return 'The verification window expired';
    case 'cancelled':
      return 'Order cancelled and refunded';
    case 'refunded':
      return 'Order refunded';
    default:
      return 'Order is being processed';
  }
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<VerificationOrder[]>([]);
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});
  const [countriesMap, setCountriesMap] = useState<Record<string, CountryMeta>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [now, setNow] = useState(() => Date.now());
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyNumber = (id: string, number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchOrdersAndLists = async () => {
      try {
        const [ordersRes, servicesRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/services'),
        ]);

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data.orders || []);
        } else if (ordersRes.status === 401) {
          router.push('/login');
        }

        if (servicesRes.ok) {
          const { services, countries } = await servicesRes.json();
          const serviceNames: Record<string, string> = {};
          const countryDetails: Record<string, CountryMeta> = {};

          services?.forEach((service: { ID: number | string; name: string }) => {
            serviceNames[String(service.ID)] = service.name;
          });
          countries?.forEach((country: { ID: number | string; name: string; short_name?: string }) => {
            countryDetails[String(country.ID)] = {
              name: country.name,
              code: country.short_name,
            };
          });

          setServicesMap(serviceNames);
          setCountriesMap(countryDetails);
        }
      } catch {
        // The page keeps its existing data if a refresh is interrupted.
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersAndLists();
  }, [router]);

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter((order) => order.status === filter || order.type === filter || order.provider === filter);

  const completedCount = orders.filter((order) => order.status === 'completed').length;
  const waitingCount = orders.filter((order) => order.status === 'waiting_for_code').length;
  const totalSpend = orders.reduce((sum, order) => sum + order.cost, 0);

  const getServiceName = (id: string) => (
    servicesMap[id] || SUPPORTED_SERVICES.find((service) => service.id === id)?.name || id
  );

  const getCountry = (id: string): CountryMeta => {
    if (countriesMap[id]) return countriesMap[id];
    const fallback = SUPPORTED_COUNTRIES.find((country) => country.code === id);
    return fallback ? { name: fallback.name, code: fallback.code } : { name: id };
  };

  if (loading) {
    return (
      <div className="orders-page orders-page--loading page-container" aria-live="polite">
        <div className="orders-loading-card">
          <SpinnerIcon className="spinner--lg spinner--indigo" />
          <span>Loading your order history</span>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page page-container">
      <div className="orders-page__back-row">
        <Link href="/dashboard" className="orders-back-link">
          <ArrowLeftIcon className="icon-sm" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="orders-page__log-label">VERIFICATION LOG</span>
      </div>

      <header className="orders-page__header">
        <div>
          <p className="orders-page__eyebrow">Your activity, in one place</p>
          <h1 className="orders-page__title">Order history</h1>
          <p className="orders-page__subtitle">
            Review every verification number, status, and code from your account.
          </p>
        </div>
        <Link href="/dashboard" className="orders-page__new-link">
          Start a verification <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className="orders-summary" aria-label="Order summary">
        <div className="orders-summary__item">
          <span className="orders-summary__label">Total orders</span>
          <strong className="orders-summary__value">{orders.length}</strong>
        </div>
        <div className="orders-summary__item">
          <span className="orders-summary__label">Completed</span>
          <strong className="orders-summary__value orders-summary__value--green">{completedCount}</strong>
        </div>
        <div className="orders-summary__item">
          <span className="orders-summary__label">Still active</span>
          <strong className="orders-summary__value orders-summary__value--coral">{waitingCount}</strong>
        </div>
        <div className="orders-summary__item">
          <span className="orders-summary__label">Total spent</span>
          <strong className="orders-summary__value">${totalSpend.toFixed(2)}</strong>
        </div>
      </section>

      <section className="orders-filter-panel" aria-label="Filter orders">
        <div className="orders-filter-panel__heading">
          <div>
            <p className="orders-section-label">Browse records</p>
            <p className="orders-filter-panel__count">
              Showing <strong>{filteredOrders.length}</strong> of {orders.length} orders
            </p>
          </div>
          <span className="orders-filter-panel__hint">Filter by status or provider</span>
        </div>
        <div className="orders-filters" role="group" aria-label="Order filters">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`orders-filter ${filter === item.key ? 'orders-filter--active' : ''}`}
              aria-pressed={filter === item.key}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {filteredOrders.length === 0 ? (
        <section className="orders-empty-state">
          <div className="orders-empty-state__icon">
            <ClipboardIcon className="icon-lg" />
          </div>
          <p className="orders-section-label">Nothing here yet</p>
          <h2>{orders.length === 0 ? 'Your history is ready for its first order.' : 'No orders match this filter.'}</h2>
          <p>
            {orders.length === 0
              ? 'Create a verification from the dashboard and it will appear here automatically.'
              : 'Try another status or provider to see more of your activity.'}
          </p>
          {orders.length === 0 && (
            <Link href="/dashboard" className="orders-empty-state__link">Go to dashboard</Link>
          )}
        </section>
      ) : (
        <section className="orders-list" aria-label="Orders">
          {filteredOrders.map((order) => {
            const timeLeft = new Date(order.expiresAt).getTime() - now;
            const country = getCountry(order.country);
            const isWaiting = order.status === 'waiting_for_code';
            const statusClass = `orders-card--${order.status.replace(/_/g, '-')}`;

            return (
              <article key={order.id} className={`orders-card ${statusClass}`}>
                <div className="orders-card__header">
                  <div className="orders-card__identity">
                    <div className="orders-card__channel" aria-hidden="true">SMS</div>
                    <div>
                      <h2 className="orders-card__service">{getServiceName(order.service)}</h2>
                      <p className="orders-card__country">
                        {country.code ? (
                          <span className={`fi fi-${country.code.toLowerCase()} orders-card__flag`} aria-hidden="true" />
                        ) : (
                          <span className="orders-card__country-mark" aria-hidden="true" />
                        )}
                        {country.name}
                      </p>
                    </div>
                  </div>
                  <div className="orders-card__badges">
                    <span className={`orders-status orders-status--${order.status.replace(/_/g, '-')}`}>
                      <span className="orders-status__dot" aria-hidden="true" />
                      {formatStatus(order.status)}
                    </span>
                    <span className="orders-type">{order.provider === 'textverified' ? PROVIDER_DISPLAY_NAMES.textverified : PROVIDER_DISPLAY_NAMES.smspool}</span>
                  </div>
                </div>

                <div className="orders-card__details">
                  <div className="orders-card__detail orders-card__detail--phone">
                    <span className="orders-card__detail-label">Phone number</span>
                    <div className="orders-card__phone-row">
                      <span>{order.phoneNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyNumber(order.id, order.phoneNumber)}
                        className="orders-copy-button"
                        aria-label="Copy phone number"
                      >
                        {copiedOrderId === order.id ? 'Copied' : <ClipboardIcon className="icon-sm" />}
                      </button>
                    </div>
                  </div>
                  <div className="orders-card__detail">
                    <span className="orders-card__detail-label">Cost</span>
                    <strong>${order.cost.toFixed(2)}</strong>
                  </div>
                  <div className="orders-card__detail">
                    <span className="orders-card__detail-label">Placed</span>
                    <strong>{formatDate(order.createdAt)}</strong>
                  </div>
                  <div className="orders-card__detail">
                    <span className="orders-card__detail-label">Time remaining</span>
                    <strong className={isWaiting ? 'orders-card__timer' : ''}>
                      {isWaiting ? formatTime(timeLeft) : '—'}
                    </strong>
                  </div>
                </div>

                {order.status === 'completed' && order.code ? (
                  <div className="orders-code-result">
                    <div className="orders-code-result__copy">
                      <span className="orders-card__detail-label">Verification code</span>
                      <strong>{order.code}</strong>
                      {order.completedAt && <small>Completed {new Date(order.completedAt).toLocaleString()}</small>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(order.id, order.code)}
                      className="orders-code-result__button"
                    >
                      {copiedCodeId === order.id ? 'Copied' : 'Copy code'}
                    </button>
                  </div>
                ) : (
                  <div className="orders-card__status-line">
                    {isWaiting ? <ClockIcon className="icon-sm" /> : <CheckCircleIcon className="icon-sm" />}
                    <span>{getStatusDescription(order.status)}</span>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
