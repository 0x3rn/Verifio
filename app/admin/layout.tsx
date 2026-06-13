'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import type { User } from '@/lib/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.isAdmin) {
            setUser(data.user);
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, [router]);

  if (loading || !user) return <DashboardSkeleton />;

  const navLinks = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/users', label: 'User Management' },
    { href: '/admin/orders', label: 'Global Orders' },
  ];

  return (
    <div className="dash-layout">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        
        {/* Sidebar */}
        <div className="dash-panel" style={{ height: 'fit-content' }}>
          <div className="dash-panel__header">
            <h2 className="dash-panel__title">Admin Controls</h2>
          </div>
          <div className="dash-panel__content" style={{ padding: '0.5rem' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {navLinks.map(link => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="dash-list__item"
                    style={{
                      borderRadius: '6px',
                      borderBottom: 'none',
                      backgroundColor: isActive ? 'var(--input-bg)' : 'transparent',
                      color: isActive ? 'var(--foreground)' : 'var(--muted)',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ minWidth: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
