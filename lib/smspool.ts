const SMSPOOL_BASE_URL = process.env.SMSPOOL_BASE_URL || 'https://api.smspool.net';
const SMSPOOL_API_KEY = process.env.SMSPOOL_API_KEY || '';

// ---- SMSpool API uses form-data (multipart/form-data) with `key` param for auth ----

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

// ---- Listing endpoints (POST with empty formdata, cached 1 hour) ----

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

// ---- Ordering operations ----

// Get account balance
export async function getBalance() {
  const data = await smspoolPost<{ success: number; balance: number }>('/request/balance');
  return {
    success: data.success === 1,
    balance: data.balance,
  };
}

// Order a new phone number for SMS verification
export async function orderSMSCode(
  country: string,
  service: string,
  pool?: string
) {
  const fields: Record<string, string> = { country, service };
  if (pool) fields.pool = pool;

  const data = await smspoolPost<{
    success: number;
    number: string;
    order_id: string;
    country: string;
    service: string;
    price: number;
    expires_in: number;
    message?: string;
    pool?: string;
  }>('/purchase/sms', fields);

  if (data.success !== 1) {
    throw new Error(data.message || 'Failed to order verification number.');
  }

  return data;
}

// Check SMS code for an order
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

// Cancel an SMS order
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

// Order a voice call for verification
export async function orderVoiceCode(country: string, service: string) {
  const data = await smspoolPost<{
    success: number;
    number: string;
    order_id: string;
    country: string;
    service: string;
    price: number;
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
// country = rental ID from /rental/retrieve_all, days = rental duration
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
    number: string;
    rental_code: string;
    price: number;
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