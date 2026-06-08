'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/app/providers';
import { SunIcon, MoonIcon, HomeIcon, ClipboardIcon, PhoneIcon, WalletIcon, LogoutIcon, MenuIcon, XIcon } from '@/components/Icons';
import type { User } from '@/lib/types';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isAuthPage) return;
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch { /* not logged in */ }
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
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setUserMenuOpen(false);
    window.location.href = '/';
  };

  // Don't render navbar on auth pages — keep them clean
  if (isAuthPage) return null;

  const navbarClass = scrolled ? 'navbar navbar--scrolled' : 'navbar navbar--transparent';

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
          {!user && (
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
          )}

          {/* Right section */}
          <div className="navbar__actions">
            {/* Theme toggle — only shown when NOT logged in */}
            {!user && (
              <button
                onClick={toggleTheme}
                className="theme-toggle"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <SunIcon className="icon-md" />
                ) : (
                  <MoonIcon className="icon-md" />
                )}
              </button>
            )}

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
                    <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="user-menu__dropdown-item">
                      <HomeIcon className="icon-md" /> Dashboard
                    </Link>
                    <Link href="/dashboard/orders" onClick={() => setUserMenuOpen(false)} className="user-menu__dropdown-item">
                      <ClipboardIcon className="icon-md" /> Order History
                    </Link>
                    <Link href="/dashboard/rentals" onClick={() => setUserMenuOpen(false)} className="user-menu__dropdown-item">
                      <PhoneIcon className="icon-md" /> My Rentals
                    </Link>
                    <Link href="/dashboard/billing" onClick={() => setUserMenuOpen(false)} className="user-menu__dropdown-item">
                      <WalletIcon className="icon-md" /> Add Funds
                    </Link>
                    <div className="user-menu__dropdown-divider" />
                    {/* Theme toggle inside user dropdown */}
                    <button
                      onClick={toggleTheme}
                      className="user-menu__dropdown-item"
                    >
                      {theme === 'dark' ? (
                        <>
                          <SunIcon className="icon-md" /> Light Mode
                        </>
                      ) : (
                        <>
                          <MoonIcon className="icon-md" /> Dark Mode
                        </>
                      )}
                    </button>
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

            {/* Mobile menu toggle */}
            {!user && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="mobile-toggle"
                aria-label="Toggle menu"
              >
                {menuOpen ? <XIcon className="icon-md" /> : <MenuIcon className="icon-md" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mobile-menu">
            <div className="mobile-menu__inner">
              <Link href="/#features" className="mobile-menu__link">Features</Link>
              <Link href="/#pricing" className="mobile-menu__link">Pricing</Link>
              <Link href="/#how-it-works" className="mobile-menu__link">How It Works</Link>
              {user && (
                <>
                  <div className="mobile-menu__divider" />
                  <Link href="/dashboard" className="mobile-menu__link">Dashboard</Link>
                  <Link href="/dashboard/orders" className="mobile-menu__link">Order History</Link>
                  <Link href="/dashboard/rentals" className="mobile-menu__link">My Rentals</Link>
                  <Link href="/dashboard/billing" className="mobile-menu__link">Add Funds</Link>
                </>
              )}
              {!user && (
                <>
                  <div className="mobile-menu__divider" />
                  <Link href="/login" className="mobile-menu__signin">Sign In</Link>
                  <Link href="/contact" className="mobile-menu__highlight">Contact Us</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

    </nav>
  );
}