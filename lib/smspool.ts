const SMSPOOL_BASE_URL = process.env.SMSPOOL_BASE_URL || 'https://api.smspool.net';
const SMSPOOL_API_KEY = process.env.SMSPOOL_API_KEY || '';

// ---- SMSpool API uses form-urlencoded POST with `key` param for auth ----

async function smspoolPost<T>(endpoint: string, fields: Record<string, string> = {}): Promise<T> {
  const formData = new URLSearchParams();
  formData.set('key', SMSPOOL_API_KEY);
  Object.entries(fields).forEach(([k, v]) => {
    if (v) formData.set(k, v);
  });

  const response = await fetch(`${SMSPOOL_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new Error(`Api error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ---- Pricing markup tiers ----

export function applyMarkup(basePrice: number): number {
  if (basePrice <= 0.30) return Math.round(basePrice * 5 * 100) / 100;
  if (basePrice <= 0.60) return Math.round(basePrice * 3.5 * 100) / 100;
  if (basePrice <= 1.50) return Math.round(basePrice * 2 * 100) / 100;
  return Math.round(basePrice * 1.5 * 100) / 100;
}

// ---- Phone number formatting ----

const COUNTRY_CODES: Record<string, string> = {
  US: '+1', GB: '+44', CA: '+1', AU: '+61', DE: '+49', FR: '+33',
  NL: '+31', SE: '+46', ID: '+62', IN: '+91', PH: '+63', BR: '+55',
};

export function formatPhoneNumber(number: string, countryCode: string): string {
  const cleaned = String(number).replace(/\D/g, '');
  const prefix = COUNTRY_CODES[countryCode] || '';
  if (!prefix) return cleaned;
  if (cleaned.startsWith('1') && countryCode === 'US') {
    const area = cleaned.substring(1, 4);
    const mid = cleaned.substring(4, 7);
    const last = cleaned.substring(7, 11);
    return `+1 (${area}) ${mid}-${last}`;
  }
  return `${prefix} ${cleaned}`;
}

// ---- Listing endpoints (cached 1 hour) ----

interface SMSPoolCountry {
  ID: number;
  name: string;
  short_name: string;
  code: string;
  iso: number;
  price?: number;
}

interface SMSPoolService {
  ID: number;
  name: string;
}

export async function getCountries(): Promise<SMSPoolCountry[]> {
  try {
    const response = await fetch(`${SMSPOOL_BASE_URL}/country/retrieve_all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({ key: SMSPOOL_API_KEY }).toString(),
      next: { revalidate: 3600 },
    });

    if (!response.ok) throw new Error(`Failed to fetch countries: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Countries fetch error:', error);
    return [];
  }
}

export async function getServices(): Promise<SMSPoolService[]> {
  try {
    const response = await fetch(`${SMSPOOL_BASE_URL}/service/retrieve_all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({ key: SMSPOOL_API_KEY }).toString(),
      next: { revalidate: 3600 },
    });

    if (!response.ok) throw new Error(`Failed to fetch services: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Services fetch error:', error);
    return [];
  }
}

// ---- Pricing ----

export async function getPrice(country: string, service: string) {
  const data = await smspoolPost<{
    success: number;
    price: number;
    success_rate?: number;
    message?: string;
  }>('/request/price', { country, service });

  if (data.success !== 1) {
    throw new Error(data.message || 'Unable to retrieve price.');
  }

  const basePrice = Number(data.price) || 0;
  return {
    basePrice,
    displayPrice: applyMarkup(basePrice),
    successRate: data.success_rate,
  };
}

// ---- Ordering operations ----

// Get account balance
export async function getBalance() {
  const data = await smspoolPost<{ success: number; balance: number }>('/request/balance');
  return {
    success: data.success === 1,
    balance: data.balance,
  };
}

// Order SMS verification
export async function orderSMSCode(
  country: string,
  service: string,
  pool?: string
) {
  const fields: Record<string, string> = { country, service };
  if (pool) fields.pool = pool;

  const data = await smspoolPost<{
    success: number;
    number: number | string;
    order_id: string;
    country: string;
    service: string;
    price: number | string;
    expires_in: number;
    message?: string;
    pool?: string;
  }>('/purchase/sms', fields);

  if (data.success !== 1) {
    throw new Error(data.message || 'Failed to order verification number.');
  }

  return data;
}

// Check SMS code
export async function checkSMSCode(orderId: string) {
  const data = await smspoolPost<{
    success: number;
    sms: string;
    code: string;
    full_sms: string;
    number: string;
    order_id: string;
    message?: string;
  }>('/sms/check', { orderid: orderId });

  if (data.success !== 1) {
    return { success: 0, code: '', full_sms: '', message: data.message || 'Not yet received' };
  }

  return data;
}

// Cancel SMS order
export async function cancelSMSOrder(orderId: string) {
  const data = await smspoolPost<{ success: number; message?: string }>(
    '/sms/cancel',
    { orderid: orderId }
  );

  if (data.success !== 1) {
    throw new Error(data.message || 'Failed to cancel order.');
  }

  return data;
}

// Resend SMS code
export async function resendSMSCode(orderId: string) {
  const data = await smspoolPost<{ success: number; message?: string; resend?: number }>(
    '/sms/resend',
    { orderid: orderId }
  );

  if (data.success !== 1) {
    throw new Error(data.message || 'Failed to resend code.');
  }

  return data;
}

// Order voice verification
export async function orderVoiceCode(country: string, service: string) {
  const data = await smspoolPost<{
    success: number;
    number: number | string;
    order_id: string;
    country: string;
    service: string;
    price: number | string;
    expires_in: number;
    message?: string;
  }>('/purchase/voice', { country, service });

  if (data.success !== 1) {
    throw new Error(data.message || 'Failed to order voice verification.');
  }

  return data;
}

// Check voice code
export async function checkVoiceCode(orderId: string) {
  const data = await smspoolPost<{
    success: number;
    code: string;
    number: string;
    order_id: string;
    message?: string;
  }>('/voice/check', { orderid: orderId });

  return data;
}

// Cancel voice order
export async function cancelVoiceOrder(orderId: string) {
  const data = await smspoolPost<{ success: number; message?: string }>(
    '/voice/cancel',
    { orderid: orderId }
  );

  return data;
}

// ---- Rental operations ----

// Get rental IDs
export async function getRentalIds() {
  const data = await smspoolPost('/rental/retrieve_all');
  return data;
}

// Order rental number
export async function orderRentalNumber(
  country: string,
  days: number,
  service?: string
) {
  const fields: Record<string, string> = {
    id: country,
    days: String(days),
  };
  if (service) fields.service_id = service;

  const data = await smspoolPost<{
    success: number;
    number: number | string;
    rental_code: string;
    price: number | string;
    expires_in: number;
    message?: string;
  }>('/purchase/rental', fields);

  if (data.success !== 1) {
    throw new Error(data.message || 'Failed to order rental number.');
  }

  return data;
}

// Get rental messages
export async function getRentalMessages(rentalCode: string) {
  const data = await smspoolPost<{
    success: number;
    sms_list?: Array<{
      sms: string;
      code: string;
      full_sms: string;
      number: string;
      time: string;
    }>;
    message?: string;
  }>('/rental/retrieve_messages', { rental_code: rentalCode });

  return data;
}

// Cancel a rental
export async function cancelRental(rentalCode: string) {
  const data = await smspoolPost<{ success: number; message?: string }>(
    '/rental/refund',
    { rental_code: rentalCode }
  );

  return data;
}

// Get rental info
export async function getRentalInfo(rentalCode: string) {
  const data = await smspoolPost('/rental/info', { rental_code: rentalCode });
  return data;
}

// Get active rentals
export async function getActiveRentals() {
  const data = await smspoolPost('/rental/retrieve');
  return data;
}

// Get rental status
export async function getRentalStatus(rentalCode: string) {
  const data = await smspoolPost('/rental/retrieve_status', { rental_code: rentalCode });
  return data;
}