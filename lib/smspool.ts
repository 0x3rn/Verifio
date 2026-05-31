const SMSPOOL_BASE_URL = process.env.SMSPOOL_BASE_URL || 'https://api.smspool.net';
const SMSPOOL_API_KEY = process.env.SMSPOOL_API_KEY || '';

// ---- v1 API helper (for ordering operations — uses key= query param auth) ----

interface SMSPoolRequestOptions {
  method?: string;
  body?: Record<string, unknown>;
}

async function smspoolRequest<T>(
  endpoint: string,
  options: SMSPoolRequestOptions = {}
): Promise<T> {
  const { method = 'GET', body } = options;

  const params = new URLSearchParams();
  params.set('key', SMSPOOL_API_KEY);

  if (body) {
    Object.entries(body).forEach(([key, value]) => {
      params.set(key, String(value));
    });
  }

  const url = `${SMSPOOL_BASE_URL}/${endpoint}`;
  const fetchUrl = method === 'GET' && params.size > 0
    ? `${url}?${params.toString()}`
    : url;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  if (method !== 'GET' && body) {
    fetchOptions.body = params.toString();
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  const response = await fetch(fetchUrl, fetchOptions);

  if (!response.ok) {
    throw new Error(`SMSPool API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ---- v2 API helpers (for listing endpoints — uses Bearer token auth) ----

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

// Fetch all available countries from SMSpool v2 API
// Cached for 1 hour since countries rarely change
export async function getCountries(): Promise<SMSPoolCountry[]> {
  try {
    const response = await fetch(`${SMSPOOL_BASE_URL}/country/retrieve_all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SMSPOOL_API_KEY}`,
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) throw new Error(`Failed to fetch countries: ${response.status}`);
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('SMSpool Countries Error:', error);
    return [];
  }
}

// Fetch all available services from SMSpool v2 API
// Cached for 1 hour since services rarely change
export async function getServices(): Promise<SMSPoolService[]> {
  try {
    const response = await fetch(`${SMSPOOL_BASE_URL}/service/retrieve_all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SMSPOOL_API_KEY}`,
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) throw new Error(`Failed to fetch services: ${response.status}`);

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('SMSpool Services Error:', error);
    return [];
  }
}

// ---- Ordering operations (v1 API — uses key= query param) ----

// Get account balance
export async function getBalance() {
  const data = await smspoolRequest<{ success: number; balance: number }>('request/balance');
  return {
    success: data.success === 1,
    balance: data.balance,
  };
}

// Order a new phone number for SMS verification
export async function orderSMSCode(
  country: string,
  service: string,
  pool: string = '0'
) {
  const data = await smspoolRequest<{
    success: number;
    number: string;
    pool: string;
    order_id: string;
    country: string;
    service: string;
    price: number;
    expires_in: number;
    message?: string;
  }>('request/sms', {
    method: 'POST',
    body: { country, service, pool },
  });

  if (data.success !== 1) {
    throw new Error(data.message || 'Failed to order SMS code');
  }

  return data;
}

// Get received SMS code for an order
export async function getSMSCode(orderId: string) {
  const data = await smspoolRequest<{
    success: number;
    sms: string;
    code: string;
    full_sms: string;
    number: string;
    order_id: string;
    country: string;
    service: string;
    message?: string;
  }>('request/sms', {
    body: { order_id: orderId, get_sms: '1' },
  });

  if (data.success !== 1 && data.success !== 0) {
    throw new Error(data.message || 'Failed to retrieve SMS code');
  }

  return data;
}

// Cancel an SMS order
export async function cancelSMSOrder(orderId: string) {
  const data = await smspoolRequest<{ success: number; message?: string }>(
    'request/sms',
    {
      method: 'POST',
      body: { order_id: orderId, cancel: '1' },
    }
  );

  if (data.success !== 1) {
    throw new Error(data.message || 'Failed to cancel order');
  }

  return data;
}

// Resend SMS code
export async function resendSMSCode(orderId: string) {
  const data = await smspoolRequest<{ success: number; message?: string }>(
    'request/sms',
    {
      method: 'POST',
      body: { order_id: orderId, resend: '1' },
    }
  );

  if (data.success !== 1) {
    throw new Error(data.message || 'Failed to resend code');
  }

  return data;
}

// Order a voice call for verification
export async function orderVoiceCode(
  country: string,
  service: string
) {
  const data = await smspoolRequest<{
    success: number;
    number: string;
    pool: string;
    order_id: string;
    country: string;
    service: string;
    price: number;
    expires_in: number;
    message?: string;
  }>('request/voice', {
    method: 'POST',
    body: { country, service },
  });

  if (data.success !== 1) {
    throw new Error(data.message || 'Failed to order voice call');
  }

  return data;
}

// Get voice code
export async function getVoiceCode(orderId: string) {
  const data = await smspoolRequest<{
    success: number;
    code: string;
    number: string;
    order_id: string;
    country: string;
    service: string;
    message?: string;
  }>('request/voice', {
    body: { order_id: orderId, get_voice: '1' },
  });

  return data;
}

// Get rental numbers availability
export async function getRentalAvailability(country: string, service: string) {
  const data = await smspoolRequest<{
    success: number;
    available: number;
    numbers?: Array<{ number: string; price: number; period: string }>;
    message?: string;
  }>('request/rental', {
    body: { country, service, availability: '1' },
  });

  return data;
}

// Order a rental number
export async function orderRentalNumber(
  country: string,
  service: string,
  days: number
) {
  const data = await smspoolRequest<{
    success: number;
    number: string;
    order_id: string;
    country: string;
    service: string;
    price: number;
    expires_in: number;
    message?: string;
  }>('request/rental', {
    method: 'POST',
    body: { country, service, days },
  });

  if (data.success !== 1) {
    throw new Error(data.message || 'Failed to order rental number');
  }

  return data;
}

// Get rental number codes
export async function getRentalCodes(rentalId: string) {
  const data = await smspoolRequest<{
    success: number;
    sms_list: Array<{
      sms: string;
      code: string;
      full_sms: string;
      number: string;
      time: string;
    }>;
    message?: string;
  }>('request/rental', {
    body: { order_id: rentalId, get_sms: '1' },
  });

  return data;
}

// Cancel a rental number
export async function cancelRental(rentalId: string) {
  const data = await smspoolRequest<{ success: number; message?: string }>(
    'request/rental',
    {
      method: 'POST',
      body: { order_id: rentalId, cancel: '1' },
    }
  );

  return data;
}