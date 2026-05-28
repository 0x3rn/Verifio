'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldIcon, CheckCircleIcon, TargetIcon, LockIcon } from '@/components/Icons';
import { SUPPORTED_SERVICES, SUPPORTED_COUNTRIES, PLAN_DURATIONS } from '@/lib/types';

const tabIcons: Record<string, React.ReactNode> = {
  sms: (
    <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  voice: (
    <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  rental: (
    <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'sms' | 'voice' | 'rental'>('sms');
  const [pricingTab, setPricingTab] = useState<'once' | 'rental'>('once');

  return (
    <div className="smooth-bg">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__blob-tr" />
        <div className="hero__blob-bl" />

        <div className="page-container">
          <div className="hero__content">
            <div className="hero__badge">
              <LockIcon className="icon-sm text-indigo" />
              <span>100% Private & Anonymous</span>
            </div>

            <h1 className="hero__title">
              OTP Verification
              <span className="hero__title-accent">Made Simple</span>
            </h1>

            <p className="hero__desc">
              Get instant SMS and voice verification codes for Google, WhatsApp, Telegram,
              and dozens of other services. Rent phone numbers by the week, month, or longer.
            </p>

            <div className="hero__actions">
              <Link href="/register" className="btn-primary">Get Started Free</Link>
              <Link href="#how-it-works" className="btn-secondary">How It Works</Link>
            </div>

            {/* Stats */}
            <div className="hero-stats">
              {[
                { value: '50+', label: 'Services' },
                { value: '100+', label: 'Countries' },
                { value: '99.9%', label: 'Uptime' },
                { value: '24/7', label: 'Support' },
              ].map((stat) => (
                <div key={stat.label} className="hero-stat">
                  <div className="hero-stat__value">{stat.value}</div>
                  <div className="hero-stat__label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section section-alt">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-header-title">Everything You Need</h2>
            <p className="section-header-subtitle">Three powerful verification methods. Choose what works best for you.</p>
          </div>

          {/* Verification type tabs */}
          <div className="tabs">
            <div className="tabs__inner">
              {[
                { key: 'sms' as const, label: 'SMS' },
                { key: 'voice' as const, label: 'Voice' },
                { key: 'rental' as const, label: 'Rental' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`tab ${activeTab === tab.key ? 'tab--active' : ''}`}
                >
                  {tabIcons[tab.key]} {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feature details */}
          <div className="feature-panel">
            {activeTab === 'sms' && (
              <div className="feature-card">
                <div className="feature-card__icon">{tabIcons.sms}</div>
                <h3 className="feature-card__title">SMS Verification</h3>
                <p className="feature-card__desc">
                  Get a disposable phone number and receive verification codes via SMS. Works with Google, WhatsApp, Telegram, and 50+ other services across 100+ countries. Most codes arrive within 10-60 seconds.
                </p>
                <div className="feature-grid-3">
                  {[
                    { title: 'Instant Delivery', desc: 'Most codes arrive within 30 seconds' },
                    { title: 'Global Coverage', desc: 'Numbers from 100+ countries worldwide' },
                    { title: 'Low Cost', desc: 'Starting at just $1.60 per verification' },
                  ].map((item) => (
                    <div key={item.title} className="feature-item">
                      <div className="feature-item__title">{item.title}</div>
                      <div className="feature-item__desc">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="feature-card">
                <div className="feature-card__icon">{tabIcons.voice}</div>
                <h3 className="feature-card__title">Voice Verification</h3>
                <p className="feature-card__desc">
                  Receive verification codes through automated voice calls. A robot caller reads your code aloud — perfect when SMS isn't available. Supports all major services with clear audio delivery.
                </p>
                <div className="feature-grid-3">
                  {[
                    { title: 'Clear Audio', desc: 'Crystal clear automated voice delivery' },
                    { title: 'Works Anywhere', desc: 'No SMS reception? Voice calls always work' },
                    { title: 'Quick Setup', desc: 'Same fast ordering as SMS verification' },
                  ].map((item) => (
                    <div key={item.title} className="feature-item">
                      <div className="feature-item__title">{item.title}</div>
                      <div className="feature-item__desc">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'rental' && (
              <div className="feature-card">
                <div className="feature-card__icon">{tabIcons.rental}</div>
                <h3 className="feature-card__title">Rental Numbers</h3>
                <p className="feature-card__desc">
                  Need a phone number for longer? Rent one for a week, month, 3 months, or 6 months. Receive unlimited verification codes during your rental period. Longer plans include significant discounts.
                </p>
                <div className="feature-grid-4">
                  {Object.entries(PLAN_DURATIONS).map(([key, plan]) => (
                    <div key={key} className="feature-plan-item">
                      <div className="feature-plan-item__label">{plan.label}</div>
                      <div className="feature-plan-item__days">{plan.days} days</div>
                      {plan.discount > 0 && (
                        <div className="feature-plan-item__discount">-{plan.discount}%</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Supported Services */}
      <section id="sms-verification" className="section">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-header-title">Supported Services</h2>
            <p className="section-header-subtitle">50+ platforms supported across all verification methods.</p>
          </div>
          <div className="services-grid">
            {SUPPORTED_SERVICES.map((service) => (
              <div key={service.id} className="service-item">
                <span className="service-item__name">{service.name}</span>
              </div>
            ))}
            <div className="services-more">+ many more</div>
          </div>
          <p className="affiliation-disclaimer">
            Verifio is an independent verification platform. We are not affiliated with, endorsed by, or sponsored by any of the listed services. All trademarks and service marks belong to their respective owners.
          </p>

          {/* Countries */}
          <div className="countries-subsection">
            <div className="countries-subsection__header">
              <h3 className="countries-subsection__title">Available Countries</h3>
              <p className="countries-subsection__desc">Phone numbers from over 100 countries worldwide</p>
            </div>
            <div className="countries-grid">
              {SUPPORTED_COUNTRIES.map((country) => (
                <div key={country.code} className="country-item">
                  <span className="country-item__name">{country.name}</span>
                </div>
              ))}
              <div className="countries-more">
                <span className="countries-more__globe">🌍</span> + many more
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section section-alt">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-header-title">How It Works</h2>
            <p className="section-subtitle">Get verified in three simple steps.</p>
          </div>
          <div className="steps-grid">
            {[
              {
                step: '1',
                title: 'Select Service & Country',
                desc: 'Choose the platform you need to verify on and pick a country for your phone number.',
                Icon: TargetIcon,
              },
              {
                step: '2',
                title: 'Get Your Number',
                desc: 'We instantly provide a phone number. Use it to request your verification code on the target platform.',
                Icon: ShieldIcon,
              },
              {
                step: '3',
                title: 'Receive Your Code',
                desc: 'We deliver the OTP code to your dashboard. Copy it and complete your verification.',
                Icon: CheckCircleIcon,
              },
            ].map((item) => (
              <div key={item.step} className="step-card">
                <div className="step-card__icon">
                  <item.Icon className="icon-xl text-indigo" />
                </div>
                <div className="step-card__number">Step {item.step}</div>
                <h3 className="step-card__title">{item.title}</h3>
                <p className="step-card__desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Verification Options */}
      <section id="pricing" className="section">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-header-title">Verification Options</h2>
            <p className="section-header-subtitle">Choose between one-time verification or long-term rental numbers.</p>
          </div>

          {/* Pricing type tabs */}
          <div className="tabs">
            <div className="tabs__inner">
              {[
                { key: 'once' as const, label: 'One-Time Verification' },
                { key: 'rental' as const, label: 'Rental Plans' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPricingTab(tab.key)}
                  className={`tab ${pricingTab === tab.key ? 'tab--active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* One-Time Verification Card */}
          {pricingTab === 'once' && (
            <div className="feature-card animate-fade-in">
              <div className="feature-card__icon">
                <TargetIcon className="icon-xl text-indigo" />
              </div>
              <h3 className="feature-card__title">One-Time Verification</h3>
              <p className="feature-card__desc">
                Get a temporary phone number for a single verification use. Once you receive your code, the number is discarded — perfect for quick account verifications.
              </p>
              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat__value">$1.60</div>
                  <div className="hero-stat__label">Starting at</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat__value">{'<30s'}</div>
                  <div className="hero-stat__label">Delivery time</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat__value">100+</div>
                  <div className="hero-stat__label">Countries</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat__value">50+</div>
                  <div className="hero-stat__label">Services</div>
                </div>
              </div>
              <ul className="pricing-card__features" style={{ marginBottom: '0', marginTop: '1.25rem', textAlign: 'center' }}>
                <li className="pricing-card__feature" style={{ justifyContent: 'center' }}>
                  <CheckCircleIcon className="icon-md pricing-card__feature-icon" /> Numbers are used once and discarded after each use
                </li>
                <li className="pricing-card__feature" style={{ justifyContent: 'center' }}>
                  <CheckCircleIcon className="icon-md pricing-card__feature-icon" /> Verification cost starts at just $1.60
                </li>
                <li className="pricing-card__feature" style={{ justifyContent: 'center' }}>
                  <CheckCircleIcon className="icon-md pricing-card__feature-icon" /> Most codes arrive within 10–60 seconds
                </li>
                <li className="pricing-card__feature" style={{ justifyContent: 'center' }}>
                  <CheckCircleIcon className="icon-md pricing-card__feature-icon" /> Pay only for what you use — no commitment
                </li>
                <li className="pricing-card__feature" style={{ justifyContent: 'center' }}>
                  <CheckCircleIcon className="icon-md pricing-card__feature-icon" /> Available via SMS or voice call
                </li>
              </ul>
              <div className="hero__actions" style={{ marginTop: '1.5rem' }}>
                <Link href="/register" className="btn-primary">Get Started</Link>
              </div>
            </div>
          )}

          {/* Rental Plans */}
          {pricingTab === 'rental' && (
            <div className="pricing-grid animate-fade-in">
              {Object.entries(PLAN_DURATIONS).map(([key, plan]) => {
                const isPopular = key === 'monthly';
                const basePrices: Record<string, number> = { weekly: 4.99, monthly: 15.99, quarterly: 39.99, biannual: 69.99 };
                const basePrice = basePrices[key] || 0;
                const discountedPrice = (basePrice * (1 - plan.discount / 100)).toFixed(2);

                return (
                  <div key={key} className={`pricing-card ${isPopular ? 'pricing-card--popular' : ''}`}>
                    {isPopular && (
                      <div className="pricing-card__badge">Most Popular</div>
                    )}
                    <div className="pricing-card__inner">
                      <h3 className="pricing-card__title">{plan.label}</h3>
                      <p className="pricing-card__subtitle">{plan.days} days</p>
                      <div className="pricing-card__price">
                        <span className="pricing-card__price-value">${discountedPrice}</span>
                        {plan.discount > 0 && (
                          <span className="pricing-card__price-original">${basePrice}</span>
                        )}
                      </div>
                      {plan.discount > 0 && (
                        <div className="pricing-card__save-badge">Save {plan.discount}%</div>
                      )}
                      <ul className="pricing-card__features">
                        <li className="pricing-card__feature">
                          <CheckCircleIcon className="icon-md pricing-card__feature-icon" /> Dedicated phone number
                        </li>
                        <li className="pricing-card__feature">
                          <CheckCircleIcon className="icon-md pricing-card__feature-icon" /> Unlimited SMS reception
                        </li>
                        <li className="pricing-card__feature">
                          <CheckCircleIcon className="icon-md pricing-card__feature-icon" /> 24/7 availability
                        </li>
                      </ul>
                      <Link
                        href="/register"
                        className={`pricing-card__cta ${isPopular ? 'pricing-card__cta--primary' : 'pricing-card__cta--secondary'}`}
                      >
                        Get Started
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section section-alt">
        <div className="page-container faq">
          <div className="section-header">
            <h2 className="section-header-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">Everything you need to know about Verifio.</p>
          </div>
          <div className="faq__list">
            {[
              { q: 'How long does it take to receive a verification code?', a: 'Most SMS codes arrive within 10-60 seconds. Voice codes take 30-90 seconds. Rental numbers receive codes instantly once the rental is active.' },
              { q: 'Which services are supported?', a: 'We support over 50 platforms including Google, WhatsApp, Telegram, Facebook, Instagram, X, Discord, Microsoft, Apple, Amazon, Tinder, Snapchat, and many more.' },
              { q: 'Can I cancel a rental number early?', a: 'Yes, you can cancel a rental before a number is issued to you. However, after a number is issued to you, you cannot cancel the rental.' },
              { q: 'What payment methods do you accept?', a: 'We accept credit/debit cards and cryptocurrency.' },
              { q: 'Are the phone numbers reusable?', a: 'SMS verification numbers are one-time use but can be reused for up to 2 times using the resend option. Rental numbers are exclusively yours for the duration of the rental period and can receive multiple codes.' },
            ].map((faq, i) => (
              <details key={i} className="faq__item">
                <summary className="faq__summary">
                  {faq.q}
                  <svg className="faq__chevron icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="faq__answer">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-section__inner">
          <div className="cta-card">
            <h2 className="cta-card__title">Ready to Get Verified?</h2>
            <p className="cta-card__desc">
              Create your account now and start verifying with phone numbers from over 100 countries.
            </p>
            <Link href="/register" className="cta-card__btn">Create Free Account</Link>
          </div>
        </div>
      </section>
    </div>
  );
}