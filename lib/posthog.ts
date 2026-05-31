'use client';

import posthog from 'posthog-js';

const POSTHOG_TOKEN = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let initialized = false;

export function initPostHog() {
  if (initialized || !POSTHOG_TOKEN) return;
  initialized = true;

  posthog.init(POSTHOG_TOKEN, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // We'll handle this manually via page_view events
    capture_pageleave: true,
    autocapture: true,       // Captures clicks, form submissions
    cross_subdomain_cookie: false,
    persistence: 'localStorage',
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.debug(false);
    },
  });
}

// Server-safe: only runs on client
export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.identify(userId, traits);
}

export function resetUser() {
  if (typeof window === 'undefined') return;
  posthog.reset();
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.capture(event, properties);
}

export function trackPageView(url?: string) {
  if (typeof window === 'undefined') return;
  posthog.capture('$pageview', {
    $current_url: url || window.location.href,
  });
}

export function setUserProperties(properties: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.people.set(properties);
}

// Feature flags
export function isFeatureEnabled(flag: string, defaultValue = false): boolean {
  if (typeof window === 'undefined') return defaultValue;
  return posthog.isFeatureEnabled(flag) ?? defaultValue;
}

export function getFeatureFlag<T>(flag: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  return (posthog.getFeatureFlag(flag) as T) ?? defaultValue;
}

export { posthog };