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
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out_forwards]">
      <header className="dash-header">
        <div>
          <h1 className="dash-header__title">Admin Overview</h1>
          <p className="dash-header__subtitle">Platform-wide statistics and metrics.</p>
        </div>
      </header>

      {stats && (
        <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <div className="dash-panel p-6 flex flex-col justify-center transition-all hover:scale-[1.02] hover:shadow-lg">
            <h3 className="text-sm font-semibold tracking-wider text-muted uppercase">Total Users</h3>
            <p className="text-4xl font-extrabold text-foreground mt-3">{stats.totalUsers}</p>
          </div>
          
          <div className="dash-panel p-6 flex flex-col justify-center transition-all hover:scale-[1.02] hover:shadow-lg">
            <h3 className="text-sm font-semibold tracking-wider text-muted uppercase">User Balances</h3>
            <p className="text-4xl font-extrabold text-foreground mt-3">${stats.totalBalances.toFixed(2)}</p>
          </div>

          <div className="dash-panel p-6 flex flex-col justify-center transition-all hover:scale-[1.02] hover:shadow-lg">
            <h3 className="text-sm font-semibold tracking-wider text-muted uppercase">Active OTPs</h3>
            <p className="text-4xl font-extrabold text-foreground mt-3">{stats.activeOrders}</p>
          </div>

          <div className="dash-panel p-6 flex flex-col justify-center transition-all hover:scale-[1.02] hover:shadow-lg">
            <h3 className="text-sm font-semibold tracking-wider text-muted uppercase">Active Rentals</h3>
            <p className="text-4xl font-extrabold text-foreground mt-3">{stats.activeRentals}</p>
          </div>
        </div>
      )}
    </div>
  );
}
