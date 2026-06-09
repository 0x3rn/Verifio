let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const email = process.env.TEXTVERIFIED_EMAIL;
  const password = process.env.TEXTVERIFIED_PASSWORD || process.env.TEXTVERIFIED_API_KEY;

  if (!email || !password) {
    throw new Error('Textverified credentials not configured in .env');
  }

  const res = await fetch('https://www.textverified.com/api/pub/v2/auth', {
    method: 'POST',
    headers: {
      'X-API-USERNAME': email,
      'X-API-KEY': password,
      'Content-Type': 'application/json'
    },
  });

  if (!res.ok) {
    throw new Error('Failed to authenticate with Textverified API V2');
  }

  const data = await res.json();
  cachedToken = data.bearerToken;
  // Buffer token expiration by 60 seconds
  tokenExpiresAt = new Date(data.expiration).getTime() - 60000;
  return cachedToken;
}

async function textverifiedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const url = `https://www.textverified.com${endpoint}`;
  
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Textverified error: ${errorText}`);
  }

  if (res.status === 201) {
    const location = res.headers.get('Location');
    if (location) {
      return { location } as any;
    }
  }

  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function orderTextVerifiedCode(serviceName: string) {
  // POST /api/pub/v2/verifications
  const createRes = await textverifiedRequest<any>('/api/pub/v2/verifications', {
    method: 'POST',
    body: JSON.stringify({ 
      serviceName: serviceName.toLowerCase(), 
      capability: 'sms' 
    })
  });
  
  if (!createRes.location) {
    throw new Error('Failed to get Location header from Textverified');
  }
  
  // Follow the Location header to get verification details
  const detailsUrl = new URL(createRes.location, 'https://www.textverified.com').pathname;
  const details = await textverifiedRequest<any>(detailsUrl);

  return {
    success: 1,
    order_id: details.id,
    number: details.number,
    cost: details.totalCost
  };
}

export async function checkTextVerifiedCode(orderId: string) {
  const data = await textverifiedRequest<any>(`/api/pub/v2/verifications/${orderId}`);
  
  let mappedStatus = 1; // pending
  if (data.state === 'verificationCompleted') mappedStatus = 3;
  else if (data.state === 'verificationCanceled' || data.state === 'verificationReported' || data.state === 'verificationTimedOut' || data.state === 'verificationRefunded') mappedStatus = 4;

  let code = '';
  if (mappedStatus === 3 || data.state === 'verificationPending') {
    // Try to fetch SMS for this verification
    const smsData = await textverifiedRequest<any>(`/api/pub/v2/sms?reservationId=${orderId}`);
    if (smsData && smsData.data && smsData.data.length > 0) {
      code = smsData.data[0].code || smsData.data[0].text || '';
      mappedStatus = 3; // Code received
    }
  }

  return {
    success: mappedStatus === 3 ? 1 : 0,
    status: mappedStatus,
    code: code,
    sms: code
  };
}

export async function cancelTextVerifiedOrder(orderId: string) {
  await textverifiedRequest<any>(`/api/pub/v2/verifications/${orderId}/cancel`, {
    method: 'POST'
  });
  return true;
}
