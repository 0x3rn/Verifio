'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircleIcon, LockIcon, TargetIcon } from '@/components/Icons';
import { SUPPORTED_COUNTRIES, SUPPORTED_SERVICES } from '@/lib/types';

type VerificationMode = 'sms' | 'proxy' | 'rental';

const modes: Record<VerificationMode, { eyebrow: string; title: string; description: string; details: string[]; label: string }> = {
  sms: {
    eyebrow: 'One-time access', title: 'SMS Verification', label: 'SMS',
    description: 'Get a disposable phone number and receive verification codes via SMS. Works with Google, WhatsApp, Telegram, and 50+ other services across 100+ countries.',
    details: ['Instant delivery. Most codes arrive within 30 seconds', 'Global coverage. Numbers from 100+ countries', 'Low cost. Starting at just $1.60 per verification'],
  },
  proxy: {
    eyebrow: 'Network access', title: 'Residential Proxies', label: 'Proxy',
    description: 'Route your connection through reliable residential IPs with flexible bandwidth packages and simple account management.',
    details: ['Residential routing from trusted locations', 'Flexible bandwidth packages', 'Credentials and expiry details in your dashboard'],
  },
  rental: {
    eyebrow: 'Longer-term access', title: 'Rental Numbers', label: 'Rental',
    description: 'Need a phone number for longer? Rent one for a week, month, 3 months, or 6 months and receive unlimited verification codes during your rental period.',
    details: ['Dedicated number for the duration you choose', 'Unlimited SMS reception while your rental is active', 'Longer plans include meaningful discounts'],
  },
};

export default function Home() {
  const [mode, setMode] = useState<VerificationMode>('sms');
  const selectedMode = modes[mode];

  return (
    <div className="v-home">
      <section className="v-hero">
        <div className="v-hero__grain" aria-hidden="true" />
        <div className="page-container v-hero__grid">
          <div className="v-hero__copy">
            <p className="v-kicker"><LockIcon className="icon-sm" /> 100% Private &amp; Anonymous</p>
            <h1>OTP Verification<br /><em>Made Simple.</em></h1>
            <p className="v-hero__lede">Get instant SMS verification codes for Google, WhatsApp, Telegram, and dozens of other services. Add a residential proxy or rent phone numbers by the week, month, or longer.</p>
            <div className="v-hero__actions"><Link href="/register" className="v-button v-button--signal">Get Started Free <span aria-hidden="true">↗</span></Link><a href="#how-it-works" className="v-button v-button--quiet">How It Works</a></div>
            <div className="v-proof" aria-label="Verifio at a glance"><span><CheckCircleIcon className="icon-sm" /> 50+ Services</span><span><CheckCircleIcon className="icon-sm" /> 100+ Countries</span><span><CheckCircleIcon className="icon-sm" /> 99.9% Uptime</span><span><CheckCircleIcon className="icon-sm" /> 24/7 Support</span></div>
          </div>
          <div className="v-console" aria-label="Example verification console">
            <div className="v-console__body">
              <div className="v-console__prompt">SELECT A PATH</div>
              <div className="v-console__choices"><div><span>Service</span><strong>Telegram</strong></div><div><span>Country</span><strong>United Kingdom</strong></div></div>
              <div className="v-console__line" />
              <div className="v-console__prompt">NUMBER ISSUED</div>
              <div className="v-console__number"><span>+44</span> 7700 900 482 <button type="button" aria-label="Example copy control">⧉</button></div>
              <div className="v-console__status"><span className="v-live"><i /> Listening for code</span><strong>04:57</strong></div>
              <div className="v-console__code"><span>Incoming code</span><b>482731</b></div>
            </div>
            <div className="v-console__foot"><span>Account balance</span><strong>$24.00</strong><span className="v-console__marker">●</span></div>
          </div>
        </div>
      </section>

      <section className="v-section v-section--modes" id="features"><div className="page-container">
        <div className="v-section__intro"><p className="v-kicker v-kicker--dark"><span /> Choose the right service</p><h2>Everything You Need<br />to stay connected.</h2><p>SMS verification, residential proxies, and rental numbers in one clear account. Choose what works best for you, then manage every step from your dashboard.</p></div>
        <div className="v-mode-layout">
          <div className="v-mode-tabs" role="tablist" aria-label="Verification methods">{(Object.keys(modes) as VerificationMode[]).map((key) => <button key={key} type="button" role="tab" aria-selected={mode === key} onClick={() => setMode(key)} className={mode === key ? 'is-active' : ''}>{modes[key].label}<b>↗</b></button>)}</div>
          <article className="v-mode-card" role="tabpanel"><p>{selectedMode.eyebrow}</p><h3>{selectedMode.title}</h3><div className="v-mode-card__content"><p>{selectedMode.description}</p><ul>{selectedMode.details.map((detail) => <li key={detail}><CheckCircleIcon className="icon-sm" /> {detail}</li>)}</ul></div><Link href="/register" className="v-text-link">Start with {selectedMode.label.toLowerCase()} <span>→</span></Link></article>
        </div>
      </div></section>

      <section className="v-section v-section--coverage" id="sms-verification"><div className="page-container">
        <div className="v-coverage-head"><div><p className="v-kicker v-kicker--dark"><span /> Global coverage</p><h2>Supported<br />Services.</h2></div><p>50+ platforms are supported for SMS verification, including the services people use every day.</p></div>
        <div className="v-directory" aria-label="Supported services">{SUPPORTED_SERVICES.map((service) => <span key={service.id}>{service.name}</span>)}<span>+ many more</span></div>
        <p className="v-disclaimer">Verifio is an independent verification platform. We are not affiliated with, endorsed by, or sponsored by any listed service. All trademarks belong to their respective owners.</p>
        <div className="v-country-strip"><div><p className="v-kicker v-kicker--dark"><span /> Available Countries</p><h3>Phone numbers from over 100 countries worldwide.</h3></div><div className="v-country-list">{SUPPORTED_COUNTRIES.map((country) => <span key={country.code}><i className={`fi fi-${country.code.toLowerCase()}`} aria-hidden="true" />{country.name}</span>)}<span><i className="v-country-list__more" aria-hidden="true">+</i>many more</span></div></div>
      </div></section>

      <section className="v-section v-section--workflow" id="how-it-works"><div className="page-container">
        <div className="v-coverage-head"><div><p className="v-kicker v-kicker--dark"><span /> A clear workflow</p><h2>How It<br />Works.</h2></div><p>Get verified in three simple steps. Your dashboard keeps the number, countdown, status, cost, and received code together.</p></div>
        <div className="v-steps">{[
          ['Select Service & Country', 'Choose the platform you need to verify on and pick a country for your phone number.'],
          ['Get Your Number', 'We instantly provide a phone number. Use it to request your verification code on the target platform.'],
          ['Receive Your Code', 'We deliver the OTP code to your dashboard. Copy it and complete your verification.'],
        ].map(([title, copy]) => <article key={title}><TargetIcon className="icon-lg" /><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </div></section>

      <section className="v-section v-section--plans" id="pricing"><div className="page-container v-plans"><div><p className="v-kicker"><span /> Service options</p><h2>Pay for the<br /><em>path you choose.</em></h2></div><div className="v-plan-copy"><p>Choose between one-time SMS verification, residential proxy packages, and long-term rental numbers. One-time numbers are discarded after use, while proxy packages give you dedicated bandwidth and rentals remain active for the plan you select.</p><p className="v-plan-copy__note">Pay only for what you use. No commitment. Debit/credit cards and cryptocurrency are accepted.</p><Link className="v-text-link v-text-link--light" href="/register">Get Started <span>→</span></Link></div></div></section>

      <section className="v-section v-section--faq" id="faq"><div className="page-container v-faq-grid"><div><p className="v-kicker v-kicker--dark"><span /> Before you start</p><h2>The useful<br />questions, answered.</h2></div><div className="v-faq-list">{[
        ['How long does it take to receive a verification code?', 'Most SMS codes arrive within 10–60 seconds. Rental numbers receive codes instantly once the rental is active.'],
        ['Which services are supported?', 'We support over 50 platforms including Google, WhatsApp, Telegram, Facebook, Instagram, X, Discord, Microsoft, Apple, Amazon, Tinder, Snapchat, and many more.'],
        ['Can I cancel a rental number early?', 'You can cancel a rental before a number is issued to you. After a number is issued, the rental cannot be cancelled.'],
        ['What payment methods do you accept?', 'We accept credit/debit cards and cryptocurrency.'],
        ['Are the phone numbers reusable?', 'SMS verification numbers are one-time use, with a resend option available up to two times. Rental numbers are exclusively yours for the rental period and can receive multiple codes.'],
      ].map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></div></section>

      <section className="v-final"><div className="page-container"><p>Ready to Get Verified?</p><h2>Create your account<br />and start today.</h2><Link href="/register" className="v-button v-button--signal">Create Free Account</Link></div></section>
    </div>
  );
}
