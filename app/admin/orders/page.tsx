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
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out_forwards] relative">
      <header className="dash-header">
        <div>
          <h1 className="dash-header__title">Global Orders</h1>
          <p className="dash-header__subtitle">View recent verification orders across the platform.</p>
        </div>
      </header>

      <div className="dash-panel overflow-hidden border-none shadow-xl bg-background/50 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-foreground/5 border-b border-border/50">
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest">Service</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest">Phone Number</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest">Cost</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground font-medium">No orders found.</td>
                </tr>
              ) : (
                orders.map((order, i) => (
                  <tr key={order.id} className="hover:bg-foreground/5 transition-colors group" style={{ animationDelay: `${i * 50}ms` }}>
                    <td className="px-6 py-4 font-semibold text-foreground">{order.username}</td>
                    <td className="px-6 py-4">
                      <span className="capitalize font-medium text-foreground bg-foreground/5 px-3 py-1 rounded-full text-sm">
                        {order.service}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm tracking-wide text-muted-foreground group-hover:text-foreground transition-colors">{order.phoneNumber}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">${order.cost.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                        order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        order.status === 'pending' || order.status === 'waiting_for_code' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 animate-pulse' :
                        'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm font-medium">
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
