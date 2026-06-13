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
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out_forwards] relative">
      <header className="dash-header">
        <div>
          <h1 className="dash-header__title">User Management</h1>
          <p className="dash-header__subtitle">View and manage platform users and their wallets.</p>
        </div>
      </header>

      <div className="dash-panel overflow-hidden border-none shadow-xl bg-background/50 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-foreground/5 border-b border-border/50">
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest">Username</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest">Balance</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {users.map((u, i) => (
                <tr key={u.id} className="hover:bg-foreground/5 transition-colors group" style={{ animationDelay: `${i * 50}ms` }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        {u.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-foreground group-hover:text-indigo-500 transition-colors">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{u.email || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-sm">
                      ${u.balance.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedUser(u)}
                      className="text-xs px-4 py-2 bg-foreground text-background hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:-translate-y-0.5 rounded-full transition-all duration-300 font-bold tracking-wide"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="dash-panel p-8 w-full max-w-md shadow-2xl scale-100 animate-[scaleIn_0.2s_ease-out] border-border/50 bg-card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground tracking-tight">Adjust Balance</h3>
              <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Adjusting funds for <strong className="text-foreground">{selectedUser.username}</strong>. Use negative values to deduct from their balance.
            </p>
            
            <form onSubmit={handleAddFunds} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-foreground font-semibold shadow-sm transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={funding}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition-all duration-300 font-bold shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
              >
                {funding ? 'Processing...' : 'Confirm Adjustment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
