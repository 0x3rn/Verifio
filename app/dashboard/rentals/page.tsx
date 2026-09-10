'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SpinnerIcon, PhoneIcon, ArrowLeftIcon, TrashIcon, EyeIcon, ClockIcon, CalendarIcon } from '@/components/Icons';
import type { RentalNumber } from '@/lib/types';
import { PROVIDER_DISPLAY_NAMES, SUPPORTED_SERVICES, SUPPORTED_COUNTRIES, PLAN_DURATIONS, TEXTVERIFIED_RENTAL_DURATIONS } from '@/lib/types';

export default function RentalsPage() {
  const router = useRouter();
  const [rentals, setRentals] = useState<RentalNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [expandedRental, setExpandedRental] = useState<string | null>(null);
  const [rentalCodes, setRentalCodes] = useState<Record<string, Array<{ sms: string; code: string; full_sms: string; number: string; time: string }>>>({});
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [wakingRentalId, setWakingRentalId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState('');

  const [copiedRentalId, setCopiedRentalId] = useState<string | null>(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<string | null>(null);

  const handleCopyNumber = (id: string, num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedRentalId(id);
    setTimeout(() => setCopiedRentalId(null), 2000);
  };

  const handleCopyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(key);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const res = await fetch('/api/rentals');
        if (res.ok) {
          const data = await res.json();
          setRentals(data.rentals || []);
        } else if (res.status === 401) {
          router.push('/login');
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Unable to load your rentals.');
        }
      } catch {
        setError('Unable to load your rentals. Check your connection and try again.');
      }
      finally { setLoading(false); }
    };
    fetchRentals();
  }, [router]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const handleViewCodes = useCallback(async (rentalId: string) => {
    if (expandedRental === rentalId) { setExpandedRental(null); return; }
    setExpandedRental(rentalId);
    if (!rentalCodes[rentalId]) {
      setLoadingCodes(true);
      try {
        const rental = rentals.find((item) => item.id === rentalId);
        if (rental && !rental.alwaysOn && rental.provider === 'textverified') {
          setWakingRentalId(rentalId);
          const wakeResponse = await fetch(`/api/rentals?rentalId=${encodeURIComponent(rentalId)}&action=wake`, { method: 'POST' });
          if (!wakeResponse.ok) {
            const wakeData = await wakeResponse.json().catch(() => ({}));
            throw new Error(wakeData.error || 'Unable to wake this rental.');
          }
        }
        const res = await fetch(`/api/rentals?rentalId=${rentalId}&action=codes`);
        if (res.ok) {
          const data = await res.json();
          setRentalCodes((prev) => ({ ...prev, [rentalId]: data.codes || [] }));
        }
      } catch (codeError) {
        setError(codeError instanceof Error ? codeError.message : 'Unable to load codes for this rental.');
      }
      finally { setLoadingCodes(false); setWakingRentalId(null); }
    }
  }, [expandedRental, rentalCodes, rentals]);

  const handleCancelRental = useCallback(async (rentalId: string) => {
    if (!confirm('Are you sure you want to cancel this rental?')) return;
    try {
      const res = await fetch(`/api/rentals?rentalId=${rentalId}`, { method: 'DELETE' });
      if (res.ok) {
        setRentals((prev) => prev.map((r) => (r.id === rentalId ? { ...r, status: 'cancelled' } : r)));
      }
    } catch {
      setError('Unable to cancel this rental. Check your connection and try again.');
    }
  }, []);

  const filteredRentals = filter === 'all' ? rentals : rentals.filter((r) => r.status === filter);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'badge--active',
      pending: 'badge--plan',
      expired: 'badge--expired',
      cancelled: 'badge--cancelled',
    };
    return map[status] || 'badge--expired';
  };

  if (loading) {
    return (
      <div className="rentals-page rentals-page--loading page-container">
        <SpinnerIcon className="spinner--lg spinner--indigo" />
        <span>Loading rentals</span>
      </div>
    );
  }

  return (
    <div className="rentals-page page-container">
      <div className="rentals-page__back-row">
        <Link href="/dashboard" className="orders-back-link">
          <ArrowLeftIcon className="icon-sm" /> Back to Dashboard
        </Link>
        <span className="rentals-page__label">PHONE RENTALS</span>
      </div>

      <header className="rentals-page__header">
        <div>
          <p className="rentals-page__eyebrow">DEDICATED NUMBERS</p>
          <h1 className="rentals-page__title">Phone rentals</h1>
          <p className="rentals-page__subtitle">Manage active numbers and view incoming codes in one place.</p>
        </div>
        <Link href="/dashboard?tab=rental" className="rentals-page__action">
          <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Start a rental
        </Link>
      </header>

      {error && <div className="rentals-page__error" role="alert">{error}</div>}

      <section className="rentals-toolbar" aria-label="Rental filters">
        <div>
          <p className="rentals-toolbar__eyebrow">YOUR NUMBERS</p>
          <h2>Rental history</h2>
        </div>
        <div className="filters">
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'expired', label: 'Expired' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`filter-btn ${filter === f.key ? 'filter-btn--active' : ''}`}
            aria-pressed={filter === f.key}
          >
            {f.label}
          </button>
        ))}
        </div>
      </section>

      {filteredRentals.length === 0 ? (
        <div className="rentals-empty">
          <div className="rentals-empty__icon">
            <PhoneIcon className="icon-xl" />
          </div>
          <h3>No phone rentals yet</h3>
          <p>
            {rentals.length === 0 ? 'Start a rental from the dashboard to keep a number active for the services you need.' : 'No rentals match this filter.'}
          </p>
          {rentals.length === 0 && (
            <Link href="/dashboard?tab=rental" className="rentals-empty__cta">Start a rental</Link>
          )}
        </div>
      ) : (
        <div className="rentals-list">
          {filteredRentals.map((rental) => {
            const service = rental.service === 'allservices' ? { name: 'All services' } : SUPPORTED_SERVICES.find((s) => s.id === rental.service);
            const country = SUPPORTED_COUNTRIES.find((c) => c.code === rental.country);
            const plan = TEXTVERIFIED_RENTAL_DURATIONS.find((option) => option.value === rental.plan)
              || PLAN_DURATIONS[rental.plan as keyof typeof PLAN_DURATIONS];
            const daysLeft = Math.max(0, Math.ceil((new Date(rental.expiresAt).getTime() - now) / (1000 * 60 * 60 * 24)));
            const isActive = rental.status === 'active';
            const progressPercent = plan ? Math.min(100, ((plan.days - daysLeft) / plan.days) * 100) : 0;

            return (
              <article key={rental.id} className="rental-card">
                <div className="rental-card__header">
                  <div>
                    <div className="rental-card__service">{service?.name || rental.service}</div>
                    <div className="rental-card__country">
                      {country && <i className={`fi fi-${country.code.toLowerCase()}`} aria-hidden="true" />}
                      {country?.name || rental.country}
                    </div>
                  </div>
                  <div className="rental-card__badges">
                    <span className={`badge ${getStatusBadge(rental.status)}`}>{rental.status}</span>
                    <span className="badge badge--plan">{plan?.label || rental.plan}</span>
                  </div>
                </div>

                <div className="rental-card__provider">{rental.provider === 'textverified' ? PROVIDER_DISPLAY_NAMES.textverified : PROVIDER_DISPLAY_NAMES.smspool} · {rental.serviceScope === 'all' ? 'All services' : 'Selected service'}</div>

                <div className="card-details rental-card__details">
                  <div>
                  <div className="card-detail__label">Phone number</div>
                    <div className="card-detail__phone-row">
                      <span>{rental.phoneNumber}</span>
                      <button
                        onClick={() => handleCopyNumber(rental.id, rental.phoneNumber)}
                        className="copy-btn"
                        title="Copy Phone Number"
                      >
                        {copiedRentalId === rental.id ? (
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
                    <div className="card-detail__label">Price</div>
                    <div className="card-detail__value">${rental.cost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="card-detail__label">Started</div>
                    <div className="card-detail__value">{new Date(rental.startedAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="card-detail__label">{isActive ? 'Days Left' : 'Status'}</div>
                    <div className={`card-detail__value ${isActive && daysLeft <= 3 ? 'card-detail__value--warn' : ''}`}>
                      {isActive ? `${daysLeft} days` : rental.status}
                    </div>
                  </div>
                </div>

                {isActive && plan && (
                  <div className="rental-card__progress">
                    <div className="progress-bar">
                      <div className="progress-bar__fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="progress-bar__info">
                      <CalendarIcon className="progress-bar__icon icon-xs" />
                      Expires {new Date(rental.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                )}

                <div className="card-actions">
                  {rental.status === 'pending' ? (
                    <span className="card-action-btn card-action-btn--disabled">Waiting for assignment</span>
                  ) : (
                    <button onClick={() => handleViewCodes(rental.id)} className="card-action-btn">
                      <EyeIcon className="icon-sm" />
                      {expandedRental === rental.id ? 'Hide Codes' : wakingRentalId === rental.id ? 'Waking line…' : rental.alwaysOn ? 'View Codes' : 'Wake & View Codes'}
                    </button>
                  )}
                  {isActive && (
                    <button onClick={() => handleCancelRental(rental.id)} className="card-action-btn card-action-btn--danger">
                      <TrashIcon className="icon-sm" />
                      Cancel
                    </button>
                  )}
                </div>

                {expandedRental === rental.id && (
                  <div className="codes-section">
                    <h4 className="codes-section__title">
                      <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Incoming codes
                    </h4>
                    {loadingCodes ? (
                      <div className="codes-section__loading">
                        <SpinnerIcon className="icon-md" /> Loading codes...
                      </div>
                    ) : rentalCodes[rental.id]?.length > 0 ? (
                      <div className="codes-list">
                        {rentalCodes[rental.id].map((code, i) => {
                          const copyKey = `${rental.id}-${i}`;
                          return (
                            <div key={i} className="code-item">
                              <div className="code-item__content">
                                <div className="code-item__time">
                                  <ClockIcon className="icon-xs" />
                                  <span className="code-item__time-text">{new Date(code.time).toLocaleString()}</span>
                                </div>
                                <div className="code-item__sms">{code.full_sms}</div>
                                {code.code && <div className="code-item__code">Code: {code.code}</div>}
                              </div>
                              {code.code && (
                                <button
                                  onClick={() => handleCopyCode(copyKey, code.code)}
                                  className="card-code-section__copy-btn"
                                >
                                  {copiedCodeIndex === copyKey ? 'Copied!' : 'Copy Code'}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="codes-section__empty">No codes received yet.</p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
