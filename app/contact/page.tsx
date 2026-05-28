'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SpinnerIcon, ShieldIcon } from '@/components/Icons';
import { Toast, useToast } from '@/components/Toast';

export default function ContactPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast('error', 'Message not sent', data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      router.push('/contact/success');
    } catch {
      addToast('error', 'Message not sent', 'A network error occurred. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="legal-page">
        <h1 className="legal-page__title">Contact Us</h1>
        <p className="legal-page__updated">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>

        <div className="contact-form">
          <form onSubmit={handleSubmit}>
            <div className="contact-form__field">
              <label htmlFor="name" className="contact-form__label">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your full name"
                className="contact-form__input"
              />
            </div>

            <div className="contact-form__field">
              <label htmlFor="email" className="contact-form__label">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="contact-form__input"
              />
            </div>

            <div className="contact-form__field">
              <label htmlFor="subject" className="contact-form__label">Subject</label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="What is this about?"
                className="contact-form__input"
              />
            </div>

            <div className="contact-form__field">
              <label htmlFor="message" className="contact-form__label">Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="Tell us how we can help..."
                className="contact-form__textarea"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="contact-form__submit"
            >
              {loading ? (
                <span className="auth-submit__inner">
                  <SpinnerIcon className="icon-md" />
                  Sending...
                </span>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Toast container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={removeToast} />
        ))}
      </div>
    </div>
  );
}