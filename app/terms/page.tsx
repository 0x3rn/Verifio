'use client';

import React from 'react';

export default function TermsPage() {
  return (
    <div className="page-container">
      <div className="legal-page">
        <h1 className="legal-page__title">Terms of Service</h1>
        <p className="legal-page__updated">Last updated: May 28, 2026</p>

        <p className="legal-page__text">
          Welcome to Verifio. By accessing or using our OTP and phone verification platform, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our service.
        </p>

        <h2 className="legal-page__heading">1. Definitions</h2>
        <ul className="legal-page__list">
          <li><strong>"Verifio"</strong> — The OTP and phone verification platform operated by us</li>
          <li><strong>"Service"</strong> — The SMS verification, voice verification, and phone number rental services provided through our platform</li>
          <li><strong>"User"</strong> — Any individual or entity that creates an account and uses our service</li>
          <li><strong>"SMSpool"</strong> — The third-party API provider used to provision phone numbers</li>
        </ul>

        <h2 className="legal-page__heading">2. Account Registration</h2>
        <p className="legal-page__text">
          To access our service, you must create an account by providing accurate and complete information, including a valid email address. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
        </p>
        <p className="legal-page__text">
          You must be at least 13 years of age (or the applicable age of digital consent in your jurisdiction) to create an account. By registering, you represent and warrant that you meet this requirement.
        </p>

        <h2 className="legal-page__heading">3. Service Usage</h2>
        <p className="legal-page__text">
          Our platform provides real phone numbers for receiving SMS and voice verification codes from supported third-party services. By using our service, you agree that:
        </p>
        <ul className="legal-page__list">
          <li>You will not use our service for any illegal, fraudulent, or unauthorized purpose</li>
          <li>You will not attempt to abuse, exploit, or circumvent our systems or the SMSpool API</li>
          <li>You are solely responsible for how you use the phone numbers and verification codes received</li>
          <li>Verifio is not responsible for the services you verify against (e.g., Google, WhatsApp, Telegram)</li>
          <li>Phone numbers are provisioned by SMSpool and availability is subject to their API limitations</li>
        </ul>

        <h2 className="legal-page__heading">4. Payments and Pricing</h2>
        <p className="legal-page__text">
          All verification services are priced according to the SMSpool API pricing model. Prices are subject to change based on SMSpool's rate adjustments. Your account balance reflects the funds available for verification orders and rentals.
        </p>
        <ul className="legal-page__list">
          <li>SMS verification orders are charged per use at the prevailing rate</li>
          <li>Voice verification orders are charged per use at the prevailing rate</li>
          <li>Rental numbers are charged for the full rental period upfront at the rates displayed on our pricing page</li>
          <li>Rental plan discounts are applied as advertised</li>
        </ul>

        <h2 className="legal-page__heading">5. Rental Numbers</h2>
        <p className="legal-page__text">
          Rental numbers provide you with a dedicated phone number for the duration of your selected plan. During the rental period:
        </p>
        <ul className="legal-page__list">
          <li>You receive unlimited SMS reception on the rented number</li>
          <li>The number is exclusively assigned to you</li>
          <li>You may cancel a rental at any time from your dashboard</li>
          <li>Refunds upon cancellation are at our discretion based on remaining rental time</li>
          <li>Rental numbers automatically expire at the end of the rental period</li>
        </ul>

        <h2 className="legal-page__heading">6. No Affiliation</h2>
        <p className="legal-page__text">
          Verifio is an independent service and is not affiliated with, endorsed by, or sponsored by any of the services for which we provide verification numbers, including but not limited to Google, WhatsApp, Telegram, Facebook, Instagram, Discord, Microsoft, Apple, Amazon, or any other companies. All trademarks and service marks belong to their respective owners.
        </p>

        <h2 className="legal-page__heading">7. Service Availability</h2>
        <p className="legal-page__text">
          We strive to maintain high availability but do not guarantee uninterrupted access to our service. The service may be unavailable due to:
        </p>
        <ul className="legal-page__list">
          <li>Maintenance or updates</li>
          <li>SMSpool API downtime or rate changes</li>
          <li>Network or infrastructure issues</li>
          <li>Events beyond our reasonable control</li>
        </ul>

        <h2 className="legal-page__heading">8. Limitation of Liability</h2>
        <p className="legal-page__text">
          To the fullest extent permitted by applicable law, Verifio shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
        </p>
        <ul className="legal-page__list">
          <li>Loss of profits, data, or business</li>
          <li>Service interruptions or unavailability</li>
          <li>Delayed or failed verification code delivery</li>
          <li>Actions taken by SMSpool or third-party services</li>
          <li>Any unauthorized access to or use of our servers or your personal information</li>
        </ul>

        <h2 className="legal-page__heading">9. Termination</h2>
        <p className="legal-page__text">
          We reserve the right to suspend or terminate your account and access to the service at our sole discretion, without notice or liability, for any reason, including but not limited to violation of these Terms. Upon termination, your right to use the service will immediately cease. Any active rentals may be cancelled without refund.
        </p>

        <h2 className="legal-page__heading">10. Changes to Terms</h2>
        <p className="legal-page__text">
          We may modify these Terms of Service at any time. We will notify users of material changes by posting the updated terms on this page and updating the "Last updated" date. Your continued use of the service after such modifications constitutes acceptance of the revised terms.
        </p>

        <h2 className="legal-page__heading">11. Governing Law</h2>
        <p className="legal-page__text">
          These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any disputes arising from these Terms or the service shall be resolved through binding arbitration or in courts of competent jurisdiction.
        </p>

        <h2 className="legal-page__heading">12. Contact</h2>
        <p className="legal-page__text">
          For questions about these Terms of Service, please visit our <a href="/contact" style={{ color: '#6366f1', textDecoration: 'none' }}>Contact Us</a> page.
        </p>
      </div>
    </div>
  );
}