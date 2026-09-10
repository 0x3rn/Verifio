'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { HomeIcon, ClipboardIcon, PhoneIcon, WalletIcon, LogoutIcon, GlobeIcon } from '@/components/Icons';
import type { User } from '@/lib/types';

export function Navbar() {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isDashboard = pathname.startsWith('/dashboard');

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authCheckFailed, setAuthCheckFailed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthPage) return;
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setAuthCheckFailed(false);
        } else if (res.status === 401) {
          setUser(null);
          setAuthCheckFailed(false);
        } else {
          setAuthCheckFailed(true);
        }
      } catch {
        // Keep the dashboard from looking signed out during a transient outage.
        setAuthCheckFailed(true);
      }
      finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [isAuthPage]);

  useEffect(() => {
    if (isAuthPage) return;
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthPage]);

  useEffect(() => {
    if (isAuthPage) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen, isAuthPage]);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      setUser(null);
      setUserMenuOpen(false);
      window.location.assign('/');
    } catch {
      setAuthCheckFailed(true);
    }
  };

  // Don't render navbar on auth pages to keep them clean
  if (isAuthPage) return null;

  // Always use solid background on dashboard pages to prevent text collision
  const navbarClass = (scrolled || isDashboard) ? 'navbar v-nav navbar--scrolled' : 'navbar v-nav navbar--transparent';
  const showAccountPlaceholder = isLoading || (isDashboard && authCheckFailed);

  return (
    <nav className={navbarClass}>
      <div className="page-container">
        <div className="navbar__inner">
          {/* Logo */}
          <Link href="/" className="navbar__logo">
            <img src="/logo.png" alt="Verifio" className="navbar__logo-img" />
            <span className="navbar__logo-text">Verifio</span>
          </Link>

          {/* Desktop nav links */}
          {!isLoading && !user ? (
            <div className="navbar__links">
              {[
                { href: '/#features', label: 'Features' },
                { href: '/#pricing', label: 'Pricing' },
                { href: '/#how-it-works', label: 'How It Works' },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="navbar__link">
                  {link.label}
                </Link>
              ))}
            </div>
          ) : <div />}

          {/* Right section */}
          <div className="navbar__actions">
            {showAccountPlaceholder ? (
              <div className="v-nav__account-placeholder" aria-hidden="true" />
            ) : (
              <>
                {/* User menu / auth buttons */}
                {user ? (
              <div className="user-menu" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="user-menu__trigger"
                >
                  <div className="user-menu__avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="user-menu__name">{user.username}</span>
                </button>
                {userMenuOpen && (
                  <div className="user-menu__dropdown">
                    <div className="user-menu__dropdown-header">
                      <p className="user-menu__dropdown-name">{user.username}</p>
                      <p className="user-menu__dropdown-email">{user.email || ''}</p>
                    </div>
                    <Link href="/dashboard" className="user-menu__dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      <HomeIcon className="icon-md" /> Dashboard
                    </Link>
                    {user.isAdmin && (
                      <Link href="/admin" className="user-menu__dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                        </svg> Admin
                      </Link>
                    )}
                    <Link href="/dashboard/orders" onClick={() => setUserMenuOpen(false)} className="user-menu__dropdown-item">
                      <ClipboardIcon className="icon-md" /> Order History
                    </Link>
                    <Link href="/dashboard/proxies" onClick={() => setUserMenuOpen(false)} className="user-menu__dropdown-item">
                      <GlobeIcon className="icon-md" /> Proxy Plans
                    </Link>
                    <Link href="/dashboard/proxies/manage" onClick={() => setUserMenuOpen(false)} className="user-menu__dropdown-item">
                      <GlobeIcon className="icon-md" /> My Proxies
                    </Link>
                    <Link href="/dashboard/rentals" onClick={() => setUserMenuOpen(false)} className="user-menu__dropdown-item">
                      <PhoneIcon className="icon-md" /> My Rentals
                    </Link>
                    <Link href="/dashboard/billing" onClick={() => setUserMenuOpen(false)} className="user-menu__dropdown-item">
                      <WalletIcon className="icon-md" /> Add Funds
                    </Link>
                    <div className="user-menu__dropdown-divider" />
                    <button onClick={handleLogout} className="user-menu__dropdown-logout">
                      <LogoutIcon className="icon-md" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="navbar__auth-btns">
                <Link href="/login" className="btn-signin">Sign In</Link>
                <Link href="/register" className="btn-cta">Get Started</Link>
              </div>
            )}

            </>
            )}
          </div>
        </div>
      </div>

    </nav>
  );
}
