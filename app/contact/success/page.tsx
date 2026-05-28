'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircleIcon } from '@/components/Icons';

export default function ContactSuccessPage() {
  return (
    <div className="page-container">
      <div className="contact-success">
        <div className="contact-success__icon">
          <CheckCircleIcon className="icon-3xl text-success" />
        </div>
        <h1 className="contact-success__title">Message Sent!</h1>
        <p className="contact-success__desc">
          Thank you for reaching out. We have received your message and will get back to you as soon as possible, typically within 24 hours.
        </p>
        <Link href="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    </div>
  );
}