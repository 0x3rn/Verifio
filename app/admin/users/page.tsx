'use client';

import React, { useEffect, useState } from 'react';

interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  balance: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !fundAmount) return;
    
    setFunding(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(fundAmount) }),
      });
      
      if (res.ok) {
        const data = await res.json();
        // Update local user state
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, balance: data.newBalance } : u));
        setSelectedUser(null);
        setFundAmount('');
      } else {
        alert('Failed to update balance');
      }
    } catch (err) {
      alert('An error occurred while updating balance');
    } finally {
      setFunding(false);
    }
  };

  if (loading) return <div className="text-gray-500 animate-pulse">Loading users...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="dash-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="dash-header__title">User Management</h1>
          <p className="dash-header__subtitle">View and manage platform users and their wallets.</p>
        </div>
      </header>

      <div className="dash-panel">
        <div style={{ overflowX: 'auto', padding: '1rem' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--card-border)' }}>Username</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--card-border)' }}>Email</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--card-border)' }}>Balance</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--card-border)' }}>Joined</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--card-border)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i === users.length - 1 ? 'none' : '1px solid var(--card-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--foreground)' }}>{u.username}</td>
                  <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.875rem' }}>{u.email || '—'}</td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#10b981' }}>${u.balance.toFixed(2)}</td>
                  <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.875rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => setSelectedUser(u)}
                      className="dash-topup-btn"
                    >
                      Fund Wallet
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fund User Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: '1rem' }}>
          <div className="dash-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', border: '1px solid var(--card-border)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.5rem' }}>Adjust Balance</h3>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Adjusting funds for <strong style={{ color: 'var(--foreground)' }}>{selectedUser.username}</strong>. Use negative values to deduct from their balance.
            </p>
            
            <form onSubmit={handleAddFunds} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="dash-selector">
                <label className="dash-label">Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="dash-input"
                  placeholder="0.00"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--foreground)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={funding}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: funding ? 0.5 : 1 }}
                >
                  {funding ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
