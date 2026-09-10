const PROXYAPP_BASE_URL = (process.env.PROXYAPP_BASE_URL || 'https://www.proxyapp.net/api').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 20_000;

export const PROXY_PACKAGE_FEATURES = [
  '150+ country locations',
  'HTTP residential IPs',
  '5-minute sticky sessions',
  'Country and city targeting',
  'Ethically sourced network',
] as const;

export interface ProxyAppPackage {
  id: number;
  name: string;
  gb: number;
  price: number;
  rate_per_gb: number;
  length_days: number;
}

export interface ProxyAppDetails {
  id: string;
  host: string;
  port: string;
  username: string;
  password: string;
  expires_at?: string;
  extend_cost?: number;
  traffic_balance_formatted?: string;
  [key: string]: unknown;
}

export interface ProxyAppExtensionResult {
  id: string;
  expires_at?: string;
  is_active?: number;
}

export interface ProxyBlocklistResult {
  blocked: boolean;
  domain: string;
  matchedRule: string | null;
  message: string;
}

export class ProxyBlocklistInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProxyBlocklistInputError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asNumber(value: unknown): number | undefined {
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(number) ? number : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getPayload(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) throw new Error('Proxy provider returned an invalid response.');
  return body;
}

function getProxyList(body: Record<string, unknown>): unknown[] {
  for (const key of ['packages', 'data', 'proxies', 'results']) {
    if (Array.isArray(body[key])) return body[key];
    if (isRecord(body[key]) && Array.isArray(body[key].items)) return body[key].items;
  }
  return [];
}

function providerError(body: Record<string, unknown>, fallback: string): string {
  return asString(body.message) || asString(body.error) || fallback;
}

async function proxyRequest(path: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  const apiKey = process.env.SMSPOOL_API_KEY;
  if (!apiKey) throw new Error('Proxy provider is not configured.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${PROXYAPP_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
    const body = getPayload(await response.json().catch(() => ({})));
    if (!response.ok || body.success === 0 || body.success === false) {
      throw new Error(providerError(body, `Proxy provider request failed (${response.status}).`));
    }
    return body;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Proxy provider request timed out.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function proxyPublicRequest(path: string): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${PROXYAPP_BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const body = getPayload(await response.json().catch(() => ({})));
    if (!response.ok || body.success === 0 || body.success === false) {
      throw new Error(providerError(body, `Proxy provider request failed (${response.status}).`));
    }
    return body;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Proxy provider request timed out.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeProxyBlocklistTarget(value: string): string {
  const target = value.trim();
  if (!target) throw new ProxyBlocklistInputError('Enter a domain or URL to check.');
  if (target.length > 2048) throw new ProxyBlocklistInputError('The domain or URL is too long.');

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(target) ? target : `https://${target}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new ProxyBlocklistInputError('Enter a valid domain or http(s) URL.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
    throw new ProxyBlocklistInputError('Enter a valid domain or http(s) URL.');
  }
  return target;
}

export async function checkProxyBlocklist(value: string): Promise<ProxyBlocklistResult> {
  const target = normalizeProxyBlocklistTarget(value);
  const body = await proxyPublicRequest(`/blocklist?domain=${encodeURIComponent(target)}`);
  const blocked = body.blocked === true || body.blocked === 1 || body.blocked === '1';
  const matchedRule = asString(body.matched_rule ?? body.matchedRule) || null;
  return {
    blocked,
    domain: asString(body.domain) || target,
    matchedRule,
    message: asString(body.message) || (blocked ? 'This domain is currently in the blocklist.' : 'This domain is not currently in the blocklist.'),
  };
}

function parsePackage(value: unknown): ProxyAppPackage | undefined {
  if (!isRecord(value)) return undefined;
  const id = asNumber(value.id);
  const gb = asNumber(value.gb ?? value.bandwidth_gb ?? value.bandwidth);
  const price = asNumber(value.price ?? value.cost);
  const ratePerGb = asNumber(value.rate_per_gb ?? value.ratePerGb) ?? (gb !== undefined && gb > 0 && price !== undefined ? price / gb : undefined);
  const lengthDays = asNumber(value.length_days ?? value.lengthDays ?? value.days) ?? 30;
  const name = asString(value.name) || (gb ? `${gb} GB proxy` : undefined);
  if (id === undefined || gb === undefined || price === undefined || ratePerGb === undefined || !name) return undefined;
  return { id, name, gb, price, rate_per_gb: ratePerGb, length_days: lengthDays };
}

export function isProxyConfigured(): boolean {
  return Boolean(process.env.SMSPOOL_API_KEY);
}

export async function getProxyPackages(): Promise<ProxyAppPackage[]> {
  const body = await proxyRequest('/packages');
  return getProxyList(body).map(parsePackage).filter((item): item is ProxyAppPackage => Boolean(item));
}

export async function orderProxyPackage(packageId: number): Promise<ProxyAppDetails> {
  if (!Number.isInteger(packageId) || packageId <= 0) throw new Error('Invalid proxy package.');
  const body = await proxyRequest('/order', {
    method: 'POST',
    body: JSON.stringify({ package: packageId }),
  });
  const raw = isRecord(body.proxy) ? body.proxy : isRecord(body.data) ? body.data : body;
  const id = asString(raw.id ?? raw.proxy_id ?? raw.identifier);
  const host = asString(raw.host ?? raw.ip);
  const port = asString(raw.port);
  const username = asString(raw.username ?? raw.user);
  const password = asString(raw.password ?? raw.pass);
  if (!id || !host || !port || !username || !password) throw new Error('Proxy provider returned incomplete credentials.');
  return {
    ...raw,
    id,
    host,
    port,
    username,
    password,
    expires_at: asString(raw.expires_at ?? raw.expiresAt),
    extend_cost: asNumber(raw.extend_cost ?? raw.extendCost),
    traffic_balance_formatted: asString(raw.traffic_balance_formatted ?? raw.trafficBalanceFormatted),
  };
}

export async function getProxyDetails(identifier: string): Promise<ProxyAppDetails> {
  if (!identifier.trim()) throw new Error('Proxy identifier is required.');
  const body = await proxyRequest(`/proxy?id=${encodeURIComponent(identifier)}`);
  const raw = isRecord(body.proxy) ? body.proxy : isRecord(body.data) ? body.data : body;
  const id = asString(raw.id ?? raw.proxy_id ?? raw.identifier) || identifier;
  const host = asString(raw.host ?? raw.ip);
  const port = asString(raw.port);
  const username = asString(raw.username ?? raw.user);
  const password = asString(raw.password ?? raw.pass);
  if (!host || !port || !username || !password) throw new Error('Proxy provider returned incomplete credentials.');
  return {
    ...raw,
    id,
    host,
    port,
    username,
    password,
    expires_at: asString(raw.expires_at ?? raw.expiresAt),
    extend_cost: asNumber(raw.extend_cost ?? raw.extendCost),
    traffic_balance_formatted: asString(raw.traffic_balance_formatted ?? raw.trafficBalanceFormatted),
  };
}

export async function extendProxyPackage(identifier: string): Promise<ProxyAppExtensionResult> {
  if (!identifier.trim()) throw new Error('Proxy identifier is required.');
  const body = await proxyRequest('/extend', {
    method: 'POST',
    body: JSON.stringify({ id: identifier }),
  });
  const raw = isRecord(body.proxy) ? body.proxy : isRecord(body.data) ? body.data : body;
  const id = asString(raw.id ?? raw.proxy_id ?? raw.identifier) || identifier;
  return {
    id,
    expires_at: asString(raw.expires_at ?? raw.expiresAt),
    is_active: asNumber(raw.is_active ?? raw.isActive),
  };
}
