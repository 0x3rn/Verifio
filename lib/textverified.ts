const TEXTVERIFIED_BASE_URL = 'https://www.textverified.com';
const TEXTVERIFIED_TIMEOUT_MS = 20_000;

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let cachedServices: { names: string[]; fetchedAt: number } | null = null;
const SERVICE_CACHE_TTL_MS = 15 * 60 * 1000;

interface TextVerifiedAuthResponse {
  token?: unknown;
  expiresAt?: unknown;
  expiresIn?: unknown;
}

interface TextVerifiedActionResponse {
  href?: unknown;
  location?: unknown;
}

interface TextVerifiedVerification {
  id?: unknown;
  number?: unknown;
  totalCost?: unknown;
  endsAt?: unknown;
  state?: unknown;
}

interface TextVerifiedSms {
  id?: unknown;
  smsContent?: unknown;
  parsedCode?: unknown;
  code?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getListPayload(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isRecord(value) && Array.isArray(value.data)) return value.data;
  return [];
}

export function isTextVerifiedConfigured(): boolean {
  return Boolean(process.env.TEXTVERIFIED_EMAIL && process.env.TEXTVERIFIED_API_KEY);
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const username = process.env.TEXTVERIFIED_EMAIL;
  const apiKey = process.env.TEXTVERIFIED_API_KEY;
  if (!username || !apiKey) {
    console.error('DEV_TV_001: Text Verified credentials are not configured.');
    throw new Error('Text Verified is not configured.');
  }

  const response = await fetch(`${TEXTVERIFIED_BASE_URL}/api/pub/v2/auth`, {
    method: 'POST',
    headers: {
      'X-API-USERNAME': username,
      'X-API-KEY': apiKey,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(TEXTVERIFIED_TIMEOUT_MS),
  });

  const data = await response.json().catch(() => ({})) as TextVerifiedAuthResponse;
  if (!response.ok) {
    console.error(`DEV_TV_002: Text Verified authentication failed with status ${response.status}.`);
    throw new Error('Text Verified authentication failed.');
  }

  const token = stringValue(data.token);
  const expiresAt = stringValue(data.expiresAt);
  const expiresIn = numberValue(data.expiresIn);
  if (!token || (!expiresAt && !expiresIn)) {
    console.error('DEV_TV_003: Text Verified returned an invalid authentication response.');
    throw new Error('Text Verified returned an invalid authentication response.');
  }

  cachedToken = token;
  tokenExpiresAt = expiresAt
    ? new Date(expiresAt).getTime() - 60_000
    : Date.now() + ((expiresIn || 300) * 1000) - 60_000;
  return token;
}

async function textVerifiedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${TEXTVERIFIED_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    signal: options.signal || AbortSignal.timeout(TEXTVERIFIED_TIMEOUT_MS),
  });
  if (!response.ok) {
    console.error(`DEV_TV_004: Text Verified request ${endpoint} failed with status ${response.status}.`);
    throw new Error('Text Verified request failed.');
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

function getActionHref(response: TextVerifiedActionResponse, locationHeader: string | null): string {
  const href = stringValue(locationHeader) || stringValue(response.href) || stringValue(response.location);
  if (!href) {
    console.error('DEV_TV_005: Text Verified did not return a follow-up action.');
    throw new Error('Text Verified did not return verification details.');
  }

  const url = new URL(href, TEXTVERIFIED_BASE_URL);
  if (url.origin !== TEXTVERIFIED_BASE_URL) {
    console.error('DEV_TV_006: Text Verified returned an unexpected action URL.');
    throw new Error('Text Verified returned an invalid action URL.');
  }
  return `${url.pathname}${url.search}`;
}

export async function getTextVerifiedServiceNames(): Promise<string[]> {
  if (cachedServices && Date.now() - cachedServices.fetchedAt < SERVICE_CACHE_TTL_MS) {
    return cachedServices.names;
  }

  const data = await textVerifiedRequest<unknown>('/api/pub/v2/services?numberType=mobile&reservationType=verification');
  const names = getListPayload(data)
    .filter(isRecord)
    .map((service) => stringValue(service.serviceName) || stringValue(service.name))
    .filter((name): name is string => Boolean(name));
  cachedServices = { names, fetchedAt: Date.now() };
  return names;
}

export async function getTextVerifiedPrice(serviceName: string) {
  const data = await textVerifiedRequest<unknown>('/api/pub/v2/pricing/verifications', {
    method: 'POST',
    body: JSON.stringify({
      serviceName: serviceName.toLowerCase(),
      areaCode: false,
      carrier: false,
      numberType: 'mobile',
      capability: 'sms',
    }),
  });
  const record = isRecord(data) ? data : {};
  const basePrice = numberValue(record.price) || numberValue(record.totalCost) || 0;
  if (basePrice <= 0) throw new Error('Text Verified pricing is unavailable.');
  return { basePrice };
}

export async function orderTextVerifiedCode(serviceName: string) {
  const createResponse = await textVerifiedRequest<TextVerifiedActionResponse>('/api/pub/v2/verifications', {
    method: 'POST',
    body: JSON.stringify({
      serviceName: serviceName.toLowerCase(),
      capability: 'sms',
    }),
  });

  const detailsPath = getActionHref(createResponse, null);
  const details = await textVerifiedRequest<TextVerifiedVerification>(detailsPath);
  const id = stringValue(details.id);
  const number = stringValue(details.number);
  if (!id || !number) {
    console.error('DEV_TV_007: Text Verified returned incomplete verification details.');
    throw new Error('Text Verified returned incomplete verification details.');
  }

  return {
    success: 1 as const,
    order_id: id,
    number,
    cost: numberValue(details.totalCost),
    expires_at: stringValue(details.endsAt),
  };
}

export async function checkTextVerifiedCode(orderId: string) {
  const details = await textVerifiedRequest<TextVerifiedVerification>(`/api/pub/v2/verifications/${encodeURIComponent(orderId)}`);
  const state = stringValue(details.state) || '';
  const messagesData = await textVerifiedRequest<unknown>(`/api/pub/v2/sms?reservationId=${encodeURIComponent(orderId)}`);
  const messages = getListPayload(messagesData).filter(isRecord) as TextVerifiedSms[];
  const message = messages.find((item) => stringValue(item.parsedCode) || stringValue(item.code) || stringValue(item.smsContent));
  const code = message
    ? stringValue(message.parsedCode) || stringValue(message.code) || stringValue(message.smsContent) || ''
    : '';
  const completed = state === 'verificationCompleted' || Boolean(code);
  const ended = ['verificationCanceled', 'verificationReported', 'verificationTimedOut', 'verificationRefunded'].includes(state);

  return {
    success: completed ? 1 : 0,
    status: completed ? 3 : ended ? 4 : 1,
    code,
    sms: code,
  };
}

export async function cancelTextVerifiedOrder(orderId: string) {
  await textVerifiedRequest<unknown>(`/api/pub/v2/verifications/${encodeURIComponent(orderId)}/cancel`, {
    method: 'POST',
  });
  return true;
}
