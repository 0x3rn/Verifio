const TEXTVERIFIED_BASE_URL = 'https://www.textverified.com';
const TEXTVERIFIED_TIMEOUT_MS = 20_000;

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let cachedServices: { names: string[]; fetchedAt: number } | null = null;
const SERVICE_CACHE_TTL_MS = 15 * 60 * 1000;
let cachedRentalOptions: { services: string[]; areaCodes: Array<{ areaCode: string; state: string }>; fetchedAt: number } | null = null;

export type TextVerifiedRentalDuration =
  | 'oneDay'
  | 'threeDay'
  | 'sevenDay'
  | 'fourteenDay'
  | 'thirtyDay'
  | 'ninetyDay'
  | 'oneYear';

export interface TextVerifiedRentalRequest {
  allowBackOrderReservations: boolean;
  duration: TextVerifiedRentalDuration;
  isRenewable: boolean;
  numberType: 'mobile';
  serviceName: string;
  capability: 'sms';
  alwaysOn: boolean;
  areaCodeSelectOption: string[] | null;
  billingCycleIdToAssignTo?: string | null;
}

export interface TextVerifiedRentalDetails {
  id: string;
  number: string;
  serviceName: string;
  totalCost: number;
  createdAt: string;
  endsAt: string | null;
  alwaysOn: boolean;
  billingCycleId: string | null;
  state: string | null;
  backordered: boolean;
}

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
  if (isRecord(value)) {
    if (Array.isArray(value.data)) return value.data;
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.results)) return value.results;
    if (isRecord(value.data)) return getListPayload(value.data);
  }
  return [];
}

function getRecordPayload(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};
  if (isRecord(value.data)) return value.data;
  return value;
}

export function buildTextVerifiedRentalPayload(input: TextVerifiedRentalRequest): Record<string, unknown> {
  return {
    allowBackOrderReservations: input.allowBackOrderReservations,
    duration: input.duration,
    isRenewable: input.isRenewable,
    numberType: input.numberType,
    serviceName: input.serviceName,
    capability: input.capability,
    alwaysOn: input.alwaysOn,
    areaCodeSelectOption: input.areaCodeSelectOption?.length ? input.areaCodeSelectOption : null,
    billingCycleIdToAssignTo: input.billingCycleIdToAssignTo ?? null,
  };
}

function unwrapAction(value: unknown): TextVerifiedActionResponse | null {
  if (!isRecord(value)) return null;
  if (stringValue(value.href) || stringValue(value.location)) return value as TextVerifiedActionResponse;
  if (isRecord(value.data)) return unwrapAction(value.data);
  return null;
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

function getActionHref(response: unknown, locationHeader: string | null): string {
  const action = unwrapAction(response);
  const href = stringValue(locationHeader) || stringValue(action?.href) || stringValue(action?.location);
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

export async function getTextVerifiedRentalOptions() {
  if (cachedRentalOptions && Date.now() - cachedRentalOptions.fetchedAt < SERVICE_CACHE_TTL_MS) {
    return cachedRentalOptions;
  }

  const [renewableData, nonrenewableData, areaCodeData] = await Promise.all([
    textVerifiedRequest<unknown>('/api/pub/v2/services?numberType=mobile&reservationType=renewable'),
    textVerifiedRequest<unknown>('/api/pub/v2/services?numberType=mobile&reservationType=nonrenewable'),
    textVerifiedRequest<unknown>('/api/pub/v2/area-codes'),
  ]);

  const services = [
    ...getListPayload(renewableData),
    ...getListPayload(nonrenewableData),
  ]
    .filter(isRecord)
    .map((service) => stringValue(service.serviceName) || stringValue(service.name))
    .filter((name): name is string => Boolean(name));
  const areaCodes = getListPayload(areaCodeData)
    .filter(isRecord)
    .map((areaCode) => ({
      areaCode: stringValue(areaCode.areaCode) || stringValue(areaCode.code) || '',
      state: stringValue(areaCode.state) || '',
    }))
    .filter((areaCode) => Boolean(areaCode.areaCode));

  cachedRentalOptions = {
    services: [...new Set(services)].sort((a, b) => a.localeCompare(b)),
    areaCodes: [...new Map(areaCodes.map((item) => [item.areaCode, item])).values()].sort((a, b) => a.areaCode.localeCompare(b.areaCode)),
    fetchedAt: Date.now(),
  };
  return cachedRentalOptions;
}

export async function getTextVerifiedRentalPrice(input: TextVerifiedRentalRequest) {
  const data = await textVerifiedRequest<unknown>('/api/pub/v2/pricing/rentals', {
    method: 'POST',
    body: JSON.stringify({
      serviceName: input.serviceName,
      areaCode: Boolean(input.areaCodeSelectOption?.length),
      numberType: input.numberType,
      capability: input.capability,
      isRenewable: input.isRenewable,
      duration: input.duration,
      alwaysOn: input.alwaysOn,
      callForwarding: false,
      billingCycleIdToAssignTo: input.billingCycleIdToAssignTo ?? null,
    }),
  });
  const record = getRecordPayload(data);
  const price = numberValue(record.price) || numberValue(record.totalCost) || 0;
  if (price <= 0) throw new Error('Text Verified rental pricing is unavailable.');
  return { basePrice: price };
}

export async function getTextVerifiedRentalInventory(input: TextVerifiedRentalRequest) {
  const data = await textVerifiedRequest<unknown>('/api/pub/v2/inventory/rentals', {
    method: 'POST',
    body: JSON.stringify({
      duration: input.duration,
      numberType: input.numberType,
      serviceName: input.serviceName,
      capability: input.capability,
    }),
  });
  const record = getRecordPayload(data);
  return numberValue(record.availableQuantity) || 0;
}

function findFirstReservationId(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const id = findFirstReservationId(item);
      if (id) return id;
    }
    return undefined;
  }
  if (!isRecord(value)) return undefined;
  if (stringValue(value.reservationType) && stringValue(value.id)) return stringValue(value.id);
  if (Array.isArray(value.reservations)) return findFirstReservationId(value.reservations);
  if (isRecord(value.data)) return findFirstReservationId(value.data);
  return undefined;
}

function findFirstBackorderId(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  const direct = Array.isArray(value.backOrderReservations) ? value.backOrderReservations : Array.isArray(value.backorderReservations) ? value.backorderReservations : null;
  if (direct) {
    const item = direct.find(isRecord);
    return item ? stringValue(item.id) : undefined;
  }
  return isRecord(value.data) ? findFirstBackorderId(value.data) : undefined;
}

function findFirstNumber(value: unknown): number | undefined {
  if (!isRecord(value)) return undefined;
  return numberValue(value.price) || numberValue(value.totalCost) || numberValue(value.total)
    || (Array.isArray(value.reservations) ? findFirstNumber(value.reservations[0]) : undefined)
    || (isRecord(value.data) ? findFirstNumber(value.data) : undefined);
}

function parseRentalDetails(value: unknown, fallback: { id: string; totalCost: number }): TextVerifiedRentalDetails {
  const record = getRecordPayload(value);
  const id = stringValue(record.id) || fallback.id;
  const number = stringValue(record.number);
  if (!number) throw new Error('Text Verified returned incomplete rental details.');
  return {
    id,
    number,
    serviceName: stringValue(record.serviceName) || 'allservices',
    totalCost: numberValue(record.totalCost) || fallback.totalCost,
    createdAt: stringValue(record.createdAt) || new Date().toISOString(),
    endsAt: stringValue(record.endsAt) || null,
    alwaysOn: Boolean(record.alwaysOn),
    billingCycleId: stringValue(record.billingCycleId) || null,
    state: stringValue(record.state) || null,
    backordered: false,
  };
}

async function getTextVerifiedRentalDetails(reservationId: string, sale: unknown) {
  const response = await textVerifiedRequest<unknown>(`/api/pub/v2/reservations/${encodeURIComponent(reservationId)}`);
  const action = unwrapAction(response);
  const details = action ? await textVerifiedRequest<unknown>(getActionHref(response, null)) : response;
  return parseRentalDetails(details, {
    id: reservationId,
    totalCost: findFirstNumber(sale) || 0,
  });
}

export async function orderTextVerifiedRental(input: TextVerifiedRentalRequest) {
  const createResponse = await textVerifiedRequest<unknown>('/api/pub/v2/reservations/rental', {
    method: 'POST',
    body: JSON.stringify(buildTextVerifiedRentalPayload(input)),
  });
  const saleAction = unwrapAction(createResponse);
  const sale = saleAction ? await textVerifiedRequest<unknown>(getActionHref(createResponse, null)) : createResponse;
  const reservationId = findFirstReservationId(sale);
  if (!reservationId) {
    const backorderId = findFirstBackorderId(sale);
    if (backorderId && input.allowBackOrderReservations) {
      return {
        id: backorderId,
        number: 'Assignment pending',
        serviceName: input.serviceName,
        totalCost: findFirstNumber(sale) || 0,
        createdAt: new Date().toISOString(),
        endsAt: null,
        alwaysOn: input.alwaysOn,
        billingCycleId: null,
        state: 'backorderPending',
        backordered: true,
      };
    }
    if (backorderId) throw new Error('This rental is out of stock. Enable back order to queue it for assignment.');
    throw new Error('Text Verified did not return a rental reservation.');
  }
  return getTextVerifiedRentalDetails(reservationId, sale);
}

export async function getTextVerifiedRentalMessages(reservationId: string) {
  const data = await textVerifiedRequest<unknown>(`/api/pub/v2/sms?reservationId=${encodeURIComponent(reservationId)}`);
  return getListPayload(data).filter(isRecord).map((message) => ({
    sms: stringValue(message.smsContent) || '',
    code: stringValue(message.parsedCode) || '',
    full_sms: stringValue(message.smsContent) || '',
    number: stringValue(message.to) || '',
    time: stringValue(message.createdAt) || new Date().toISOString(),
  }));
}

export async function wakeTextVerifiedRental(reservationId: string) {
  const response = await textVerifiedRequest<unknown>('/api/pub/v2/wake-requests', {
    method: 'POST',
    body: JSON.stringify({ reservationId }),
  });
  return unwrapAction(response) ? textVerifiedRequest<unknown>(getActionHref(response, null)) : response;
}

export async function refundTextVerifiedRental(reservationId: string, isRenewable: boolean) {
  const kind = isRenewable ? 'renewable' : 'nonrenewable';
  await textVerifiedRequest<unknown>(`/api/pub/v2/reservations/rental/${kind}/${encodeURIComponent(reservationId)}/refund`, {
    method: 'POST',
  });
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
