'use client';

import Link from 'next/link';
import React from 'react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="page-container footer__inner">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <Link href="/" className="footer__brand-logo">
              <img src="/logo.png" alt="Verifio" className="footer__brand-img" />
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

          {/* Legal & Support */}
          <div>
            <h4 className="footer__heading">Legal & Support</h4>
            <ul className="footer__links">
              <li><Link href="/privacy" className="footer__link">Privacy Policy</Link></li>
              <li><Link href="/terms" className="footer__link">Terms of Service</Link></li>
              <li><Link href="/contact" className="footer__link">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">&copy; {new Date().getFullYear()} Verifio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}