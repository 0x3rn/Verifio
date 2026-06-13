'use client';

import React, { useEffect, useState } from 'react';

interface AdminStats {
  totalUsers: number;
  totalBalances: number;
  activeOrders: number;
  activeRentals: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          setError('Failed to load stats');
        }
      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-gray-500 animate-pulse">Loading overview...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="dash-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="dash-header__title">Admin Overview</h1>
          <p className="dash-header__subtitle">Platform-wide statistics and metrics.</p>
        </div>
      </header>

      {stats && (
        <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="dash-panel">
            <div className="dash-panel__header">
              <h3 className="dash-panel__title">Total Users</h3>
            </div>
            <div className="dash-panel__content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)' }}>{stats.totalUsers}</p>
            </div>
          </div>
          
          <div className="dash-panel">
            <div className="dash-panel__header">
              <h3 className="dash-panel__title">User Balances</h3>
            </div>
            <div className="dash-panel__content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)' }}>${stats.totalBalances.toFixed(2)}</p>
            </div>
          </div>

          <div className="dash-panel">
            <div className="dash-panel__header">
              <h3 className="dash-panel__title">Active OTPs</h3>
            </div>
            <div className="dash-panel__content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)' }}>{stats.activeOrders}</p>
            </div>
          </div>

          <div className="dash-panel">
            <div className="dash-panel__header">
              <h3 className="dash-panel__title">Active Rentals</h3>
            </div>
            <div className="dash-panel__content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)' }}>{stats.activeRentals}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
