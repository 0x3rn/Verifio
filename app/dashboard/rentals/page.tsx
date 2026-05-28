'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SpinnerIcon, PhoneIcon, ArrowLeftIcon, TrashIcon, EyeIcon, ClockIcon, CalendarIcon } from '@/components/Icons';
import type { RentalNumber } from '@/lib/types';
import { SUPPORTED_SERVICES, SUPPORTED_COUNTRIES, PLAN_DURATIONS } from '@/lib/types';

export default function RentalsPage() {
  const router = useRouter();
  const [rentals, setRentals] = useState<RentalNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [expandedRental, setExpandedRental] = useState<string | null>(null);
  const [rentalCodes, setRentalCodes] = useState<Record<string, Array<{ sms: string; code: string; full_sms: string; number: string; time: string }>>>({});
  const [loadingCodes, setLoadingCodes] = useState(false);

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
        }
      } catch { /* keep existing */ }
      finally { setLoading(false); }
    };
    fetchRentals();
  }, [router]);

  const handleViewCodes = useCallback(async (rentalId: string) => {
    if (expandedRental === rentalId) { setExpandedRental(null); return; }
    setExpandedRental(rentalId);
    if (!rentalCodes[rentalId]) {
      setLoadingCodes(true);
      try {
        const res = await fetch(`/api/rentals?rentalId=${rentalId}&action=codes`);
        if (res.ok) {
          const data = await res.json();
          setRentalCodes((prev) => ({ ...prev, [rentalId]: data.codes || [] }));
        }
      } catch { /* failed */ }
      finally { setLoadingCodes(false); }
    }
  }, [expandedRental, rentalCodes]);

  const handleCancelRental = useCallback(async (rentalId: string) => {
    if (!confirm('Are you sure you want to cancel this rental?')) return;
    try {
      const res = await fetch(`/api/rentals?rentalId=${rentalId}`, { method: 'DELETE' });
      if (res.ok) {
        setRentals((prev) => prev.map((r) => (r.id === rentalId ? { ...r, status: 'cancelled' } : r)));
      }
    } catch { /* failed */ }
  }, []);

  const filteredRentals = filter === 'all' ? rentals : rentals.filter((r) => r.status === filter);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'badge--active',
      expired: 'badge--expired',
      cancelled: 'badge--cancelled',
    };
    return map[status] || 'badge--expired';
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
          <h1 className="sub-page-header__title">My Rentals</h1>
          <p className="sub-page-header__subtitle">Manage your rented phone numbers and view received codes.</p>
        </div>
        <Link href="/dashboard" className="sub-page-header__action">
          <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New Rental
        </Link>
      </div>

      {/* Filters */}
      <div className="filters">
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'expired', label: 'Expired' },
          { key: 'cancelled', label: 'Cancelled' },
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

      {/* Rentals list */}
      {filteredRentals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon-wrapper">
            <PhoneIcon className="icon-2xl empty-state__icon" />
          </div>
          <h3 className="empty-state__title">No rentals found</h3>
          <p className="empty-state__desc">
            {rentals.length === 0 ? 'Rent a phone number for a week, month, or longer from the dashboard.' : 'No rentals match the selected filter.'}
          </p>
          {rentals.length === 0 && (
            <Link href="/dashboard" className="empty-state__cta">Start a Rental</Link>
          )}
        </div>
      ) : (
        <div className="card-list">
          {filteredRentals.map((rental) => {
            const service = SUPPORTED_SERVICES.find((s) => s.id === rental.service);
            const country = SUPPORTED_COUNTRIES.find((c) => c.code === rental.country);
            const plan = PLAN_DURATIONS[rental.plan as keyof typeof PLAN_DURATIONS];
            const daysLeft = Math.max(0, Math.ceil((new Date(rental.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            const isActive = rental.status === 'active';
            const progressPercent = plan ? Math.min(100, ((plan.days - daysLeft) / plan.days) * 100) : 0;

            return (
              <div key={rental.id} className="list-card">
                <div className="list-card__header">
                  <div>
                    <div className="list-card__service">{service?.name || rental.service}</div>
                    <div className="list-card__country">{country?.name || rental.country}</div>
                  </div>
                  <div className="list-card__badges">
                    <span className={`badge ${getStatusBadge(rental.status)}`}>{rental.status}</span>
                    <span className="badge badge--plan">{plan?.label || rental.plan}</span>
                  </div>
                </div>

                <div className="card-details">
                  <div>
                    <div className="card-detail__label">Phone Number</div>
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
                    <div className="card-detail__label">Cost</div>
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

                {/* Progress bar */}
                {isActive && plan && (
                  <div className="mb-4">
                    <div className="progress-bar">
                      <div className="progress-bar__fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="progress-bar__info">
                      <CalendarIcon className="progress-bar__icon icon-xs" />
                      Expires {new Date(rental.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="card-actions">
                  <button onClick={() => handleViewCodes(rental.id)} className="card-action-btn">
                    <EyeIcon className="icon-sm" />
                    {expandedRental === rental.id ? 'Hide Codes' : 'View Codes'}
                  </button>
                  {isActive && (
                    <button onClick={() => handleCancelRental(rental.id)} className="card-action-btn card-action-btn--danger">
                      <TrashIcon className="icon-sm" />
                      Cancel
                    </button>
                  )}
                </div>

                {/* Received codes */}
                {expandedRental === rental.id && (
                  <div className="codes-section">
                    <h4 className="codes-section__title">
                      <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Received Codes
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
                      <p className="codes-section__empty">No verification codes received yet.</p>
                    )}
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