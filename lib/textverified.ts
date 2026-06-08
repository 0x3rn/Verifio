let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const email = process.env.TEXTVERIFIED_EMAIL;
  const apiKey = process.env.TEXTVERIFIED_API_KEY;

  if (!email || !apiKey) {
    throw new Error('Textverified credentials not configured in .env');
  }

  const res = await fetch('https://www.textverified.com/api/SimpleToken', {
    method: 'POST',
    headers: {
      'X-SimpleToken-Email': email,
      'X-SimpleToken-Password': apiKey,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to authenticate with Textverified');
  }

  const data = await res.json();
  cachedToken = data.bearerToken;
  // Token usually valid for 24h, cache it for 23h
  tokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000;
  return cachedToken;
}

async function textverifiedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const url = `https://www.textverified.com/api${endpoint}`;
  
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Textverified error: ${errorText}`);
  }

  return res.json() as Promise<T>;
}

let cachedTargets: any[] | null = null;

export async function resolveTextVerifiedTargetId(serviceName: string): Promise<string> {
  if (!cachedTargets) {
    cachedTargets = await textverifiedRequest<any[]>('/Targets');
  }
  const target = cachedTargets.find(t => t.name.toLowerCase() === serviceName.toLowerCase());
  if (!target) {
    throw new Error(`Service ${serviceName} not supported on Textverified.`);
  }
  return target.targetId.toString();
}

export async function orderTextVerifiedCode(serviceName: string) {
  const targetId = await resolveTextVerifiedTargetId(serviceName);
  
  // POST /api/Verifications
  const data = await textverifiedRequest<any>('/Verifications', {
    method: 'POST',
    body: JSON.stringify({ id: Number(targetId) })
  });

  // data will contain id (order id), number, cost
  return {
    success: 1,
    order_id: data.id,
    number: data.number,
    cost: data.cost
  };
}

export async function checkTextVerifiedCode(orderId: string) {
  const data = await textverifiedRequest<any>(`/Verifications/${orderId}`);
  
  // status: Pending, Completed, Cancelled, Refunded, TimeLimitExceeded
  let mappedStatus = 1; // pending
  if (data.status === 'Completed') mappedStatus = 3; // completed
  else if (data.status === 'Cancelled' || data.status === 'Refunded' || data.status === 'TimeLimitExceeded') mappedStatus = 4; // cancelled

  return {
    success: mappedStatus === 3 ? 1 : 0,
    status: mappedStatus,
    code: data.code || '',
    sms: data.sms || ''
  };
}

export async function cancelTextVerifiedOrder(orderId: string) {
  await textverifiedRequest<any>(`/Verifications/${orderId}/Cancel`, {
    method: 'PUT'
  });
  return true;
}
