'use client';

import React, { useEffect, useState } from 'react';
import type { VerificationOrder } from '@/lib/types';

// Extended type for admin view
interface AdminOrder extends VerificationOrder {
  username: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/admin/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders);
        } else {
          setError('Failed to load orders');
        }
      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="text-gray-500 animate-pulse">Loading orders...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="dash-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="dash-header__title">Global Orders</h1>
          <p className="dash-header__subtitle">View recent verification orders across the platform.</p>
        </div>
      </header>

      <div className="dash-panel">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--card-border)' }}>User</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--card-border)' }}>Service</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--card-border)' }}>Phone Number</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--card-border)' }}>Cost</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--card-border)' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--card-border)' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>No orders found.</td>
                </tr>
              ) : (
                orders.map((order, i) => (
                  <tr key={order.id} style={{ borderBottom: i === orders.length - 1 ? 'none' : '1px solid var(--card-border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--foreground)' }}>{order.username}</td>
                    <td style={{ padding: '1rem', color: 'var(--foreground)', textTransform: 'capitalize' }}>{order.service}</td>
                    <td style={{ padding: '1rem', color: 'var(--muted)', fontFamily: 'monospace' }}>{order.phoneNumber}</td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--foreground)' }}>${order.cost.toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        textTransform: 'uppercase',
                        backgroundColor: order.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : (order.status === 'pending' || order.status === 'waiting_for_code' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(244, 63, 94, 0.1)'),
                        color: order.status === 'completed' ? '#10b981' : (order.status === 'pending' || order.status === 'waiting_for_code' ? '#6366f1' : '#f43f5e'),
                      }}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
