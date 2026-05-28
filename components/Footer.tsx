'use client';

import Link from 'next/link';
import { ShieldIcon } from '@/components/Icons';

export function Footer() {
  return (
    <footer className="footer">
      <div className="page-container footer__inner">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <Link href="/" className="footer__brand-logo">
              <div className="footer__brand-icon">
                <ShieldIcon className="icon-md text-white" />
              </div>
              <span className="footer__brand-name">Verifio</span>
            </Link>
            <p className="footer__brand-desc">
              Reliable OTP and phone verification platform. SMS, voice calls, and rental numbers for all your verification needs. Powered by SMSpool.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="footer__heading">Services</h4>
            <ul className="footer__links">
              <li><Link href="/#features" className="footer__link">SMS Verification</Link></li>
              <li><Link href="/#features" className="footer__link">Voice Verification</Link></li>
              <li><Link href="/#features" className="footer__link">Rental Numbers</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="footer__heading">Platform</h4>
            <ul className="footer__links">
              <li><Link href="/#features" className="footer__link">Features</Link></li>
              <li><Link href="/#pricing" className="footer__link">Pricing</Link></li>
              <li><Link href="/#how-it-works" className="footer__link">How It Works</Link></li>
              <li><Link href="/#faq" className="footer__link">FAQ</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="footer__heading">Account</h4>
            <ul className="footer__links">
              <li><Link href="/dashboard" className="footer__link">Dashboard</Link></li>
              <li><Link href="/login" className="footer__link">Sign In</Link></li>
              <li><Link href="/register" className="footer__link">Create Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">&copy; {new Date().getFullYear()} Verifio. All rights reserved.</p>
          <p className="footer__powered">
            Powered by{' '}
            <a href="https://smspool.net" target="_blank" rel="noopener noreferrer">
              SMSpool
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}