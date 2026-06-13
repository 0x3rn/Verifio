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
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="dash-panel sticky top-24 p-2">
            <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-4 pt-3">
              Admin Controls
            </h2>
            <nav className="flex flex-col gap-1 pb-2">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-3 ${
                    pathname === link.href 
                      ? 'bg-foreground text-background shadow-md transform scale-[1.02]' 
                      : 'text-foreground/80 hover:bg-foreground/5 hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
