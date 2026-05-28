'use client';

import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="page-container">
      <div className="legal-page">
        <h1 className="legal-page__title">Privacy Policy</h1>
        <p className="legal-page__updated">Last updated: May 28, 2026</p>

        <p className="legal-page__text">
          At Verifio, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our OTP and phone verification platform. Please read this policy carefully. If you do not agree with the terms of this privacy policy, please do not access the service.
        </p>

        <h2 className="legal-page__heading">1. Information We Collect</h2>

        <h3 className="legal-page__subheading">Personal Information</h3>
        <p className="legal-page__text">
          When you register for an account, we collect information that can be used to identify you, including:
        </p>
        <ul className="legal-page__list">
          <li>Full name</li>
          <li>Email address</li>
          <li>Account password (hashed and salted)</li>
        </ul>

        <h3 className="legal-page__subheading">Verification Data</h3>
        <p className="legal-page__text">
          When you request verification services, we process and store:
        </p>
        <ul className="legal-page__list">
          <li>Phone numbers you use for verification</li>
          <li>Services and platforms you verify against</li>
          <li>Country of the phone number used</li>
          <li>Verification codes received (if applicable)</li>
          <li>Order timestamps and status</li>
        </ul>

        <h3 className="legal-page__subheading">Automatically Collected Information</h3>
        <p className="legal-page__text">
          We may automatically collect certain information when you access our service, including:
        </p>
        <ul className="legal-page__list">
          <li>Browser type and version</li>
          <li>Operating system</li>
          <li>IP address</li>
          <li>Pages visited and time spent</li>
          <li>Referring URL</li>
        </ul>

        <h2 className="legal-page__heading">2. How We Use Your Information</h2>
        <p className="legal-page__text">
          We use the information we collect for the following purposes:
        </p>
        <ul className="legal-page__list">
          <li>To create and manage your account</li>
          <li>To process verification orders and rentals</li>
          <li>To communicate with you regarding your orders and account</li>
          <li>To improve our platform and user experience</li>
          <li>To detect and prevent fraudulent activity</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2 className="legal-page__heading">3. Data Sharing and Disclosure</h2>
        <p className="legal-page__text">
          We do not sell, trade, or rent your personal information to third parties. We may share information in the following circumstances:
        </p>
        <ul className="legal-page__list">
          <li><strong>Service Providers:</strong> We engage SMSpool and other third-party services to facilitate phone number provisioning. These providers receive only the information necessary to complete the verification service you requested.</li>
          <li><strong>Legal Requirements:</strong> We may disclose information if required by law, subpoena, or other legal process.</li>
          <li><strong>Protection of Rights:</strong> We may disclose information to protect the rights, property, or safety of Verifio, our users, or others.</li>
        </ul>

        <h2 className="legal-page__heading">4. Data Retention</h2>
        <p className="legal-page__text">
          We retain your personal information and verification history for as long as your account remains active or as needed to provide you services. Verification orders and associated data are retained for a period of 90 days after completion, after which they may be anonymized or deleted. You may request deletion of your account and associated data at any time by contacting us.
        </p>

        <h2 className="legal-page__heading">5. Data Security</h2>
        <p className="legal-page__text">
          We implement appropriate technical and organizational security measures to protect your personal information, including:
        </p>
        <ul className="legal-page__list">
          <li>Password hashing using industry-standard algorithms (bcrypt)</li>
          <li>JWT-based authentication with HTTP-only cookies</li>
          <li>HTTPS encryption for all data in transit</li>
          <li>Regular security review of our codebase and dependencies</li>
        </ul>

        <h2 className="legal-page__heading">6. Cookies</h2>
        <p className="legal-page__text">
          We use essential cookies to maintain your authenticated session and remember your theme preference (light/dark mode). These cookies are necessary for the proper functioning of the service and do not track you across websites. We do not use third-party tracking cookies or analytics cookies.
        </p>

        <h2 className="legal-page__heading">7. Your Rights</h2>
        <p className="legal-page__text">
          Depending on your jurisdiction, you may have the following rights regarding your personal data:
        </p>
        <ul className="legal-page__list">
          <li><strong>Access:</strong> Request a copy of your personal data</li>
          <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
          <li><strong>Deletion:</strong> Request deletion of your personal data</li>
          <li><strong>Portability:</strong> Receive your data in a structured format</li>
          <li><strong>Objection:</strong> Object to certain processing activities</li>
        </ul>
        <p className="legal-page__text">
          To exercise any of these rights, please contact us through our Contact Us page or email.
        </p>

        <h2 className="legal-page__heading">8. Children's Privacy</h2>
        <p className="legal-page__text">
          Our service is not directed to individuals under the age of 13 (or the applicable age of digital consent in your jurisdiction). We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.
        </p>

        <h2 className="legal-page__heading">9. Changes to This Policy</h2>
        <p className="legal-page__text">
          We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the revised policy on this page and updating the "Last updated" date. Your continued use of the service after such changes constitutes acceptance of the updated policy.
        </p>

        <h2 className="legal-page__heading">10. Contact Information</h2>
        <p className="legal-page__text">
          If you have any questions about this Privacy Policy or our data practices, please contact us through our <a href="/contact" style={{ color: '#6366f1', textDecoration: 'none' }}>Contact Us</a> page.
        </p>
      </div>
    </div>
  );
}